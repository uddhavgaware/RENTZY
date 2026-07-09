const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const roles = [
  {
    title: "Chief Executive Officer (CEO/CTO)",
    subtitle: "LEADERSHIP & CODE",
    objective: "Write flawless code for the app and website while setting the absolute vision for what RentXY will become in 5 years.",
    skills: "The Visionary & Builder. Needs extreme logic for coding, high emotional intelligence to keep the team from fighting, and the ability to work 16-hour days without complaining.",
    execution: "You must split your day 80/20. Spend 80% of your time isolated in a room coding features, and 20% of your time holding a strict daily meeting with the COO to ensure the rest of the team isn't slacking off. You dictate the product features based on what the CBO tells you the market wants.",
    do: [
      "Make final, fast decisions even if they are risky.",
      "Praise your team publicly when they hit targets.",
      "Prioritize fixing app-crashing bugs over building new features."
    ],
    dont: [
      "Don't micromanage. Let your officers do their jobs.",
      "Don't promise features to users if you can't code them in time.",
      "Don't take arguments personally; separate friendship from business."
    ],
    color: "#2563EB"
  },
  {
    title: "Chief Operating Officer (COO)",
    subtitle: "INTERNAL MANAGEMENT",
    objective: "Manage all other officers (CBO, UAM, SMM) daily. Build tracking sheets and remove roadblocks so the CEO can just focus on coding.",
    skills: "The Organized Executor. Must be highly organized, strict, and excel at Excel/Notion. Needs a 'no-excuses' personality capable of pushing friends to work hard.",
    execution: "Your job is building 'systems'. Create a Google Sheet that tracks exactly how many Flat Owners the CBO called today, and how many Reels the SMM posted. At 9 PM every night, you review the sheet. If an officer failed, you are the one who calls them to ask why.",
    do: [
      "Hold a quick 10-minute daily standup meeting with the team.",
      "Create clear, written step-by-step processes for everyone.",
      "Take the blame if the operational team fails a target."
    ],
    dont: [
      "Don't let your friends get away with laziness just because you are in 1st year.",
      "Don't bother the CEO with small team fights; fix it yourself.",
      "Don't rely on memory; write everything down in trackers."
    ],
    color: "#7C3AED"
  },
  {
    title: "Chief Business Officer (CBO)",
    subtitle: "PROPERTY PARTNERSHIPS",
    objective: "Convince flat owners and hostel managers to list their properties exclusively on RentXY for zero brokerage.",
    skills: "The Fearless Hustler. Must be highly extroverted, thick-skinned (can handle rejection), and persuasive. Needs high confidence to talk to 40-year-old property owners.",
    execution: "You do not sit in a room. You are on your bike/scooty all day. You look for 'To-Let' signs, call the numbers, and visit every PG around the college. You explain that brokers steal 1 month's rent, but RentXY gives them tenants for free. You must hit a target of X new properties listed every week.",
    do: [
      "Dress neatly when meeting owners to build instant trust.",
      "Listen to the owners' problems and report them to the CEO to build as features.",
      "Follow up multiple times. They won't say yes on day 1."
    ],
    dont: [
      "Don't take rejection personally. 9 out of 10 owners will say no.",
      "Don't make false promises about how many tenants they will get.",
      "Don't argue with brokers if they get angry; just walk away."
    ],
    color: "#D97706"
  },
  {
    title: "Logistics Operations Manager (LOM)",
    subtitle: "MOVER NETWORK",
    objective: "Find, verify, and manage all Packers & Movers so tenants have a seamless, damage-free moving experience.",
    skills: "The Negotiator. Needs street-smarts, strict negotiation skills, and a commanding voice to ensure truck drivers and movers don't cheat users on pricing.",
    execution: "Search JustDial or local maps for Movers. Call them and offer them a steady stream of college students looking to shift. Negotiate a fixed, transparent price list. When a tenant books a mover, you personally track the truck to ensure they arrive on time and don't damage the furniture.",
    do: [
      "Physically verify the truck and ID cards of the moving company before onboarding them.",
      "Build a strict penalty system if a mover damages a tenant's TV or bed.",
      "Keep a backup mover ready in case the primary one cancels."
    ],
    dont: [
      "Don't let movers negotiate prices *after* they load the truck.",
      "Don't trust unverified vendors, it risks the tenant's safety."
    ],
    color: "#16A34A"
  },
  {
    title: "User Acquisition Manager (UAM)",
    subtitle: "TENANT GROWTH",
    objective: "Make sure students, professionals, and families are actually downloading the app to search for flats and roommates.",
    skills: "The Data-Driven Marketer. Needs an understanding of human psychology, basic data analytics, and the creativity to figure out 'hacks' to get free users.",
    execution: "Your job is 'Growth Hacking' on zero budget. You sneak into college WhatsApp groups and send links. You convince the college council to promote RentXY. You create a referral program where if a student invites a friend, they both get ₹100 off their moving costs. You check the database daily to see how many new sign-ups happened.",
    do: [
      "Target students at the exact time semesters end/start when they are looking for PGs.",
      "A/B test different WhatsApp messages to see which one gets more clicks."
    ],
    dont: [
      "Don't spam. If you spam groups aggressively, people will hate the brand.",
      "Don't bring in thousands of users if the CBO hasn't listed enough flats yet (Empty app = dead app)."
    ],
    color: "#E11D48"
  },
  {
    title: "Social Media Manager (SMM)",
    subtitle: "BRAND IDENTITY",
    objective: "Build an energetic, viral brand on Instagram, X, and YouTube that college students actually want to follow.",
    skills: "The Creative Trendsetter. Must live on the internet. Needs excellent video editing skills (CapCut/Premiere), meme knowledge, and a strong visual aesthetic.",
    execution: "Instead of posting boring corporate posters, you post 'Room Tour' Reels of the best flats on RentXY. You post funny memes about how much college students hate paying brokers. You script, shoot, and edit 3 Reels a week. You respond to every single comment and DM within 10 minutes.",
    do: [
      "Use trending audio and formats for your Reels to go viral for free.",
      "Show the faces of the founding team! People trust faces more than logos.",
      "Maintain a consistent color theme (like RentXY Blue)."
    ],
    dont: [
      "Don't post low-quality, blurry photos of properties.",
      "Don't sound like a boring bank. Use casual, Gen-Z friendly language."
    ],
    color: "#DB2777"
  },
  {
    title: "Quality Assurance Lead (QA)",
    subtitle: "APP TESTING",
    objective: "Find absolutely every error, glitch, or bad design choice in the app before the actual users see it.",
    skills: "The Perfectionist. Needs extreme attention to detail, high patience, and the ability to think like a complete beginner who doesn't know how tech works.",
    execution: "Every time the CEO finishes writing a new feature, you try to break it. You press buttons too fast. You try to upload a PDF instead of an Image. You test the app on a slow 3G internet connection and on a 4-year-old Android phone. You write down a list of bugs and give them back to the CEO.",
    do: [
      "Record your screen when you find a bug so the CEO can see exactly what happened.",
      "Test what happens when a user types absolute nonsense into a search bar."
    ],
    dont: [
      "Don't assume a feature works just because it worked yesterday. Test it again.",
      "Don't be afraid to tell the CEO that their design looks bad or confusing."
    ],
    color: "#0D9488"
  }
];

const generateHtml = (role) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #0f172a;
    }
    
    .page-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      box-sizing: border-box;
      background: #ffffff;
      min-height: 100vh;
      border-top: 16px solid ${role.color};
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .tagline {
      font-size: 11px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 900;
      margin: 0 0 10px 0;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    
    .subtitle {
      display: inline-block;
      background: ${role.color}15;
      color: ${role.color};
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: ${role.color};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }

    .content-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 20px;
      border-radius: 12px;
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
    }
    
    .content-box strong {
      color: #0f172a;
    }

    .dos-donts {
      display: flex;
      gap: 20px;
    }

    .list-box {
      flex: 1;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }

    .list-title {
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .do-title { color: #16a34a; }
    .dont-title { color: #dc2626; }

    ul {
      margin: 0;
      padding-left: 20px;
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
    }

    li {
      margin-bottom: 12px;
    }
    li:last-child {
      margin-bottom: 0;
    }

    .footer {
      text-align: center;
      margin-top: 50px;
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div class="tagline">RentXY Startup Masterclass • 1st Year Playbook</div>
      <h1>${role.title}</h1>
      <div class="subtitle">${role.subtitle}</div>
    </div>

    <div class="section">
      <div class="section-title">Primary Objective</div>
      <div class="content-box">
        <strong>Your Goal:</strong> ${role.objective}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Skill & Personality</div>
      <div class="content-box">
        ${role.skills}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Execution Strategy (How to Work)</div>
      <div class="content-box" style="border-left: 4px solid ${role.color};">
        ${role.execution}
      </div>
    </div>

    <div class="dos-donts">
      <div class="list-box">
        <div class="list-title do-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          DO THIS (In Deep)
        </div>
        <ul>
          ${role.do.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      
      <div class="list-box">
        <div class="list-title dont-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          DO NOT DO THIS
        </div>
        <ul>
          ${role.dont.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="footer">
      CONFIDENTIAL • FOR RENTXY FOUNDING TEAM ONLY
    </div>
  </div>
</body>
</html>
`;

(async () => {
  try {
    const outputDir = path.join(__dirname, 'Team_Assignments');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const browser = await puppeteer.launch({ 
      headless: 'new',
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    });
    
    for (const role of roles) {
      const page = await browser.newPage();
      const htmlContent = generateHtml(role);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Clean up the title for filename
      const filename = role.title.replace(/[\/\(\)]/g, '').replace(/\s+/g, '_') + '.pdf';
      const filepath = path.join(outputDir, filename);
      
      await page.pdf({
        path: filepath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });
      
      console.log(`✅ Generated: ${filename}`);
      await page.close();
    }
    
    await browser.close();
    console.log('\\n🎉 All Job PDFs have been successfully generated in the "Team_Assignments" folder!');
  } catch (error) {
    console.error('Error generating PDFs:', error);
  }
})();
