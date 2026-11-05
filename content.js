/* Peaks Quest: all copy and config.
   Plain globals (not ES modules) so the game also runs from file://.
   Strings may be a plain string, or { spinoff: "...", sme: "..." } for flavour text.
   {place}, {product}, {company} are replaced from FLAVOUR below. */

window.CONFIG = {
  SITE_URL: "https://beyondswisspeaks.ch",
  LINKEDIN_URL: "https://www.linkedin.com/company/beyond-swiss-peaks/",
  CONTACT_EMAIL: "simoneattanasio11@gmail.com", // TODO: replace with simone@beyondswisspeaks.ch once Workspace is set up
  MAILTO_SUBJECT: "Hello from Peaks Quest"
};

window.CONTENT = {
  start: {
    headline: "Build a company in three minutes.",
    subline: "A tiny game about what Beyond Swiss Peaks does.",
    button: "Start",
    footer: "beyondswisspeaks.ch"
  },

  avatarScreen: {
    label: "Step 1 of 2",
    headline: "Choose your founder.",
    typeQuestion: "Your company is a…",
    types: { spinoff: "Spin-off", sme: "SME" },
    button: "Let's go"
  },

  avatars: {
    founderM: { name: "Founder", tag: "He / him", blurb: "Clear-eyed. Slightly under-caffeinated.", lines: "founder" },
    founderF: { name: "Founder", tag: "She / her", blurb: "Runs on data and stubbornness.", lines: "founder" },
    robot:    { name: "The Dumb AI", tag: "It / beep", blurb: "Very confident. Often wrong. Learns fast.", lines: "robot" }
  },

  /* A handful of flavour words that change with Spin-off / SME. */
  FLAVOUR: {
    spinoff: { place: "your lab", product: "your sensor", company: "spin-off" },
    sme:     { place: "your factory floor", product: "your machines", company: "SME" }
  },

  map: {
    health: "Company health",
    stages: ["Idea", "Prototype", "Prototype", "First customers", "First customers", "Growing", "Growing", "Growing", "Funded"],
    hint: "Tap the glowing station. Or drag, or use the arrow keys.",
    goNext: "Walk to {n}",
    goFinish: "Walk to Launch",
    locked: "Locked for now. Finish {n} first.",
    alreadyDone: "Done already. On to the next one.",
    finishLocked: "The launch pad opens after station 08.",
    finishLabel: "Launch",
    greet: {
      founder: "Right. Out of {place} and into the world. Station 01 first.",
      robot: "Hello. I have read the entire internet. Where is the company? … Ah, we build it. Station 01."
    }
  },

  /* Avatar lines: one before (intro) and one after (outro) each mission. */
  lines: {
    founder: {
      intro: [
        "Right. What are we actually for?",
        "Time to talk to people who might pay.",
        "Let's write it so my mum gets it.",
        "We can't do everything alone. Who fills the gap?",
        "Some of this week should not involve me.",
        "Numbers. Let's hear what they're whispering.",
        "Grant season. Coffee, please.",
        "Three minutes with an investor. No pressure."
      ],
      outro: [
        "One sentence. I can say that at a party.",
        "Three customers. Marco brought snacks, at least.",
        "Shorter, clearer, strangely calming.",
        "A partner that fits. Now it's real.",
        "My Fridays are back.",
        "Good thing we caught that in time.",
        "Submitted. Now we wait, politely.",
        "They asked for a second meeting."
      ],
      skip: "Skipping ahead. We'll revisit it at the next board meeting."
    },
    robot: {
      intro: [
        "Strategy loaded: do everything, everywhere, at once. Correct?",
        "Plan: optimise the customers by removing them. Fewer customers, fewer problems.",
        "Excellent. I will add more words. Words are good.",
        "Searching for a partner… should I start with dating apps?",
        "Automate everything, including the humans. Very efficient!",
        "Scanning chart… the bars are a lovely shade of grey. No risk detected.",
        "Grant application? I'll write it as one sentence. 40,000 words.",
        "Pitch deck ready: 312 slides. Shall I start with slide 1, \"Hello\"?"
      ],
      outro: [
        "So \"everything\" was not the answer… ah. One problem, owned properly.",
        "Removing customers made revenue zero… ah, grow the pipeline instead.",
        "Fewer words, more meaning. Recalibrating my entire personality.",
        "Not dating. Fit. The partner fills the gap. Noted.",
        "Humans keep the hard parts, bots get the Fridays. Understood.",
        "The grey bars were money leaving… ah. Runway. Got it.",
        "Order matters: science, impact, plan, budget. Saving to memory.",
        "Three slides. Three! My circuits feel lighter."
      ],
      skip: "Skipping. I also skip the terms and conditions."
    }
  },

  mission: {
    irlLabel: "In real life, BSP does:",
    continue: "Continue",
    skip: "Skip mission",
    close: "Back to map"
  },

  /* The 8 missions. Mechanics live in game.js; words live here. */
  missions: [
    {
      id: "strategy", tag: "Strategy", action: "Set the direction", module: "Strategy", color: "green",
      title: "Pick a positioning",
      setup: "Customers, investors and your own team all ask the same thing: what exactly do you do, and for whom? Pick the line for the homepage.",
      options: [
        { id: "vague", text: "Everything for everyone, everywhere.", reply: "Bold. Also impossible to sell. Try narrowing it." },
        { id: "sharp", correct: true, text: {
            spinoff: "We tell hospital labs in two hours, not two days, whether their kit is truly sterile.",
            sme: "We cut unplanned downtime on bottling lines by 40%." } },
        { id: "investor", text: "Whatever the last investor said.", reply: "Very agreeable. Next month it will be something else." }
      ],
      success: "One customer, one problem, one sentence. That's a strategy you can test.",
      irl: "Positioning, business model, go-to-market, pricing and roadmaps."
    },
    {
      id: "sales", tag: "Sales", action: "Talk to customers", module: "Customer relations & sales", color: "orange",
      title: "Move leads through the pipeline",
      setup: "Tap a lead to move it one stage forward. Get three of them to Won.",
      stages: ["New", "Talked", "Proposal", "Won"],
      leads: {
        spinoff: ["Hospital lab, Basel", "Pharma QA team, Lyon", "Dental clinic group", "Cousin Marco (not a lead)"],
        sme: ["Brewery, Ghent", "Dairy co-op, Bern", "Juice bottler, Turin", "Cousin Marco (not a lead)"]
      },
      notLeadIndex: 3,
      marco: [
        "Marco loves you. Marco will never buy anything.",
        "Marco says he'll \"share it with a friend\". He won't.",
        "Still Marco. Still not a lead. Still invited for dinner."
      ],
      advance: ["Discovery call booked.", "Proposal sent.", "Signed. Somebody ring a (silent) bell."],
      alreadyWon: "Already won. Treat them well.",
      success: "Three customers who actually chose you. Marco remains family.",
      irl: "Customer discovery, sales process, CRM set-up and a pipeline you trust."
    },
    {
      id: "marketing", tag: "Marketing", action: "Say it clearly", module: "Marketing & branding", color: "pink",
      title: "Cut the jargon",
      setup: "Your homepage draft says a lot and means very little. Tap the four buzzwords to cut them.",
      /* BUZZWORD-MISSION-START: the only place these words may appear. */
      draft: [
        "Our", { buzz: "cutting-edge" }, "platform", "creates", { buzz: "synergy" }, "across", "{place},",
        { buzz: "leveraging" }, { buzz: "disruptive" }, "AI", "to", "make", "everything", "better."
      ],
      /* BUZZWORD-MISSION-END */
      clean: {
        spinoff: "Our sensor tells hospital labs in two hours whether their kit is sterile.",
        sme: "Our sensors warn bottling plants a week before a machine breaks."
      },
      counter: "Clarity: {n} of 4",
      normal: ["That one is doing honest work.", "Keep it. It's a real word.", "Innocent. Look for the shiny ones."],
      cleanLabel: "Rewritten",
      success: "Shorter, and a customer can repeat it to their boss.",
      irl: "Brand identity, website, content, LinkedIn, PR and events."
    },
    {
      id: "bd", tag: "Partnerships", action: "Find the right partner", module: "Business development & partnerships", color: "pink",
      title: "Complete the puzzle",
      setup: { spinoff: "Your sensor works in the lab. The missing piece is a real place to prove it.",
               sme: "Your machines sell well at home. The missing piece is a way into new markets." },
      have: { spinoff: ["Technology", "Team"], sme: ["Product", "Team"] },
      gap: { spinoff: "Pilot site", sme: "Channel abroad" },
      partners: {
        spinoff: [
          { id: "hospital", correct: true, name: "University hospital", offer: "Runs a sterilisation unit and wants to test new methods." },
          { id: "warehouse", name: "Logistics group", offer: "Offers a very large warehouse, very cheaply.", reply: "Lovely warehouse. Your sensor fits in a shoebox." },
          { id: "influencer", name: "Influencer, 2M followers", offer: "Offers \"exposure\".", reply: "Exposure doesn't validate a sensor. Data does." }
        ],
        sme: [
          { id: "distributor", correct: true, name: "Regional distributor", offer: "Already sells to 300 food plants in Germany and Austria." },
          { id: "billboard", name: "Ad agency", offer: "Offers a huge billboard at the airport.", reply: "Very visible. Not one purchase order." },
          { id: "influencer", name: "Influencer, 2M followers", offer: "Offers \"exposure\".", reply: "Food plants rarely buy machines from a reel." }
        ]
      },
      success: "Their need, your gap, one pilot. A good fit doesn't need forcing.",
      irl: "Partner outreach, deal structuring, pilots and consortia."
    },
    {
      id: "ops", tag: "Operations", action: "Automate the boring", module: "Operations", color: "orange",
      title: "Automate the boring",
      setup: "Five things eat your week. Automate the repetitive ones, keep a human on the ones that need judgment.",
      automateLabel: "Automate",
      humanLabel: "Keep human",
      tasks: [
        { text: "Chasing unpaid invoices every Friday", answer: "auto" },
        { text: "Calling a customer who is upset", answer: "human" },
        { text: "Copy-pasting leads from email into the CRM", answer: "auto" },
        { text: "Hiring your first employee", answer: "human" },
        { text: "Building the weekly report by hand", answer: "auto" }
      ],
      right: { auto: "Automated. That's an hour back every week.", human: "Right. Some things need a person." },
      wrong: { auto: "A bot soothing an upset customer. Let's not.", human: "You could. You could also get your Fridays back." },
      success: "The robots got the Fridays. You got the judgment calls.",
      irl: "Process design, automation, tooling, project management, data infrastructure."
    },
    {
      id: "finance", tag: "Finance & risk", action: "Spot the risk", module: "Finance, BI & risk", color: "purple",
      title: "Spot the risk",
      setup: "Cash at month end, in thousands. Sales are up and the team is cheerful. Tap the part of the chart that should worry you.",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      cash: [420, 410, 430, 415, 395, 320, 230, 140],
      riskFrom: 5,
      fine: ["Steady month. In finance, boring is good.", "Nothing wrong here. Look further right."],
      flagged: "Flagged: at this burn rate, cash runs out in about two months.",
      tieIn: "KPI dashboards without a data team: you'd have seen this in May.",
      success: "Caught early, it's a plan. Caught late, it's a crisis.",
      irl: "Management reporting, KPI dashboards and risk analysis."
    },
    {
      id: "public", tag: "Public funding", action: "Win the grant", module: "Public funding", color: "purple",
      title: "Assemble the application",
      setup: "A Horizon Europe-style proposal has four parts. Tap them in the order the evaluators read them.",
      order: ["Excellence", "Impact", "Implementation", "Budget"],
      blurbs: ["Why the science is strong", "Who benefits, and how", "Work plan, team, risks", "What it costs, and why"],
      hints: [
        "Start with why the science is excellent.",
        "After the science: who benefits, and how much.",
        "Now show how you'll actually do it.",
        "Money comes last, once they believe the plan."
      ],
      stackLabel: "Your proposal",
      success: "Assembled. Now it only needs 45 pages and a 17:00 Brussels deadline.",
      irl: "EIC, Horizon Europe, regional grants, R&D tax credits, consortium coordination."
    },
    {
      id: "private", tag: "Private funding", action: "Meet the investor", module: "Private funding", color: "purple",
      title: "Build the 3-slide pitch",
      setup: "The investor has three minutes and one coffee. Pick exactly three slides.",
      slides: [
        { id: "problem", text: "Problem" },
        { id: "traction", text: "Traction" },
        { id: "arch", text: "Technical architecture (47 slides)", joke: true },
        { id: "team", text: "Team" },
        { id: "market", text: "Market" },
        { id: "ask", text: "The Ask" }
      ],
      required: ["problem", "ask"],
      roast: "The investor has gone for a second coffee. Possibly forever.",
      pitchButton: "Pitch it",
      picked: "{n} of 3 picked",
      noProblem: "They don't know why it matters yet. Add the Problem.",
      noAsk: "Nice story. But what do you want from them? Add The Ask.",
      success: "Problem, proof, ask. They want a second meeting.",
      irl: "Pitch deck, financial model, data room, investor targeting, term sheets."
    }
  ],

  finish: {
    label: "Launch complete",
    headline: "Your company is launched.",
    summary: "That's what we do, one module at a time, or all of them.",
    book: "Book a call",
    visit: "Visit beyondswisspeaks.ch",
    follow: "Follow on LinkedIn",
    qrLabel: "Scan to visit",
    again: "Play again",
    legal: "Need legal, IP or formal governance work? We'll point you to the right specialist partners."
  }
};
