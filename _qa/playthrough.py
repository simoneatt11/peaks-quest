"""Automated QA for Peaks Quest.

Runs full playthroughs at 390x844 and 1280x800 for all three avatars over HTTP,
plus one run over file://, with every non-local network request blocked.
Usage: python3 _qa/playthrough.py   (from inside bsp-game/)
"""
import http.server, socketserver, threading, functools, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
QA = ROOT / "_qa"
PORT = 8765
VIEWPORTS = {"mobile": {"width": 390, "height": 844}, "desktop": {"width": 1280, "height": 800}}
AVATARS = ["founderM", "founderF", "robot"]
failures = []


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=str(ROOT))
    httpd = socketserver.TCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def check(cond, msg):
    if not cond:
        failures.append(msg)
        print("  FAIL:", msg)


def no_hscroll(page, where):
    sw, iw = page.evaluate("[document.documentElement.scrollWidth, window.innerWidth]")
    check(sw <= iw, f"horizontal scroll on {where}: {sw} > {iw}")


def wait_mission(page, n):
    page.wait_for_selector("#overlay", state="visible", timeout=8000)
    label = page.inner_text("#m-label")
    check(label.startswith(f"0{n}"), f"expected mission 0{n}, got {label!r}")


def expect_wrong(page, what):
    fb = page.inner_text("#m-feedback").strip()
    check(fb != "" and page.is_hidden("#m-success"), f"wrong answer gave no feedback ({what})")


def finish_mission(page):
    page.wait_for_selector("#m-success", state="visible", timeout=4000)
    page.click("#m-continue")
    page.wait_for_selector("#overlay", state="hidden")


def play(p, vp_name, avatar, url, shots=False, skip_one=False, company="spinoff", reduced=False, tag=""):
    print(f"- {vp_name} / {avatar} / {company} / {url.split(':')[0]}{' / reduced-motion' if reduced else ''}")
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport=VIEWPORTS[vp_name], has_touch=vp_name == "mobile",
                              is_mobile=vp_name == "mobile", reduced_motion="reduce" if reduced else "no-preference")
    external, logs = [], []

    def route(r):
        u = r.request.url
        if u.startswith(f"http://127.0.0.1:{PORT}") or u.startswith("file://") or u.startswith("data:"):
            r.continue_()
        else:
            external.append(u)
            r.abort()
    ctx.route("**/*", route)
    page = ctx.new_page()
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
    shot = lambda name: shots and page.screenshot(path=str(QA / f"{vp_name}_{name}.png"))

    page.goto(url)
    page.wait_for_selector("#btn-start")
    page.wait_for_timeout(400)
    shot("1_start"); no_hscroll(page, "start")
    page.click("#btn-start")
    page.click(f"[data-avatar={avatar}]")
    page.click(f"[data-type={company}]")
    page.wait_for_timeout(300)
    shot("2_avatar"); no_hscroll(page, "avatar")
    page.click("#btn-go")
    page.wait_for_selector("#screen-map", state="visible")
    page.wait_for_timeout(500)
    shot("3_map"); no_hscroll(page, "map")

    # keyboard movement works (desktop)
    if vp_name == "desktop":
        before = page.get_attribute("#player", "transform")
        page.keyboard.down("ArrowUp"); page.wait_for_timeout(250); page.keyboard.up("ArrowUp")
        check(page.get_attribute("#player", "transform") != before, "arrow keys did not move the avatar")

    # tapping a locked station shows a toast, not a mission
    page.click("[data-station='4'] .dot", force=True)
    page.wait_for_timeout(150)
    check(page.is_hidden("#overlay") and page.inner_text("#toast") != "", "locked station did not respond with a toast")

    # 1 Strategy: tap the station itself (auto-walk), Esc closes, reopen, wrong then right
    page.click("[data-station='0'] .dot", force=True)
    wait_mission(page, 1)
    page.keyboard.press("Escape")
    page.wait_for_selector("#overlay", state="hidden")
    page.click("#btn-next"); wait_mission(page, 1)
    page.click("[data-id=vague]"); expect_wrong(page, "strategy")
    page.click("[data-id=investor]"); expect_wrong(page, "strategy retry")
    page.click("[data-id=sharp]")
    finish_mission(page)

    # 2 Sales
    page.click("#btn-next"); wait_mission(page, 2)
    page.click("[data-lead='3']"); expect_wrong(page, "cousin Marco")
    for lead in ("0", "1", "2"):
        for _ in range(3):
            page.click(f"[data-lead='{lead}']")
    page.wait_for_timeout(450)
    shot("4_mission_sales")
    finish_mission(page)

    # 3 Marketing
    page.click("#btn-next"); wait_mission(page, 3)
    page.click(".w:not([data-buzz])"); expect_wrong(page, "normal word")
    for b in page.query_selector_all("[data-buzz]"):
        b.click()
    page.wait_for_timeout(450)
    shot("5_mission_jargon")
    finish_mission(page)
    if avatar == "robot" and not shots and not reduced and url.startswith("http"):
        page.wait_for_timeout(300)
        page.screenshot(path=str(QA / f"{vp_name}_3b_map_robot_midgame.png"))

    # 4 BD (optionally skipped)
    page.click("#btn-next"); wait_mission(page, 4)
    if skip_one:
        page.click("#m-skip")
        page.wait_for_selector("#overlay", state="hidden")
        check(page.get_attribute("[data-station='3']", "class").find("done") >= 0, "skipped station not marked done")
    else:
        page.click("[data-id=influencer]"); expect_wrong(page, "partner")
        page.click("[data-id=hospital]" if company == "spinoff" else "[data-id=distributor]")
        finish_mission(page)

    # 5 Ops
    page.click("#btn-next"); wait_mission(page, 5)
    page.click("[data-task='0'] [data-choice=human]")
    check(page.inner_text("[data-task='0'] .res") != "", "ops wrong choice gave no feedback")
    for i, ans in enumerate(["auto", "human", "auto", "human", "auto"]):
        page.click(f"[data-task='{i}'] [data-choice={ans}]")
    finish_mission(page)

    # 6 Finance
    page.click("#btn-next"); wait_mission(page, 6)
    page.click("[data-month='1']"); expect_wrong(page, "finance")
    page.click("[data-month='6']")
    page.wait_for_timeout(450)
    shot("6_mission_finance")
    finish_mission(page)

    # 7 Public funding: wrong order first, then right
    page.click("#btn-next"); wait_mission(page, 7)
    page.click("[data-section=Budget]"); expect_wrong(page, "proposal order")
    for s in ("Excellence", "Impact", "Implementation", "Budget"):
        page.click(f"[data-section={s}]")
    finish_mission(page)

    # 8 Private funding: joke slide, missing Ask, then fix
    page.click("#btn-next"); wait_mission(page, 8)
    page.click("[data-slide=arch]"); expect_wrong(page, "joke slide")
    for s in ("problem", "traction", "team"):
        page.click(f"[data-slide={s}]")
    page.click(".pitch-row .btn"); expect_wrong(page, "no ask")
    page.click("[data-slide=team]"); page.click("[data-slide=ask]")
    page.click(".pitch-row .btn")
    page.wait_for_timeout(300)
    shot("7_mission_pitch")
    finish_mission(page)

    check(page.inner_text("#health-stage") == "Funded", "health label did not reach Funded")
    page.click("#btn-next")
    page.wait_for_selector("#screen-finish", state="visible", timeout=8000)
    page.wait_for_timeout(2600)
    shot("8_finish"); no_hscroll(page, "finish")
    if shots:
        page.screenshot(path=str(QA / f"{vp_name}_8_finish_full.png"), full_page=True)
    check(len(page.query_selector_all("#finish-chips li")) == 8, "finish chips != 8")
    check(page.get_attribute("#btn-book", "href").startswith("mailto:"), "book a call is not a mailto")
    check(page.evaluate("document.querySelector('.qr img').naturalWidth") > 0, "QR image did not load")

    page.click("#btn-again")
    page.wait_for_selector("#screen-avatar", state="visible")

    check(not external, f"external requests attempted: {external}")
    check(not logs, f"console errors/warnings: {logs}")
    browser.close()


def main():
    httpd = serve()
    base = f"http://127.0.0.1:{PORT}/index.html"
    with sync_playwright() as p:
        for vp in VIEWPORTS:
            for i, av in enumerate(AVATARS):
                play(p, vp, av, base, shots=(i == 0), skip_one=(i == 1),
                     company="sme" if i == 2 else "spinoff")
        play(p, "mobile", "robot", base, reduced=True, skip_one=True)
        play(p, "mobile", "founderF", (ROOT / "index.html").as_uri(), company="sme")
    httpd.shutdown()
    print("\nRESULT:", "PASS" if not failures else f"{len(failures)} FAILURES")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
