import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'recursiveqna-production-jwt-key-2026';

const token = jwt.sign(
  {
    id: 'abhayraj',
    name: 'ABHAY R SINGH',
    role: 'user',
    field_of_interest: 'General',
  },
  JWT_SECRET,
  { expiresIn: '30d' }
);

const questions = [
  // --- Personal Finance (10) ---
  {
    field: "Personal Finance",
    title: "What’s the difference between net worth and cash flow?",
    content: "Net worth = assets minus liabilities (a snapshot); cash flow = money in minus money out over time (a movie)."
  },
  {
    field: "Personal Finance",
    title: "Why is an emergency fund recommended before investing?",
    content: "It prevents selling investments at a loss during crises, preserving long-term growth while covering 3–6 months of expenses."
  },
  {
    field: "Personal Finance",
    title: "How does compound interest benefit savers but hurt debtors?",
    content: "It grows savings exponentially over time but also amplifies high-interest debt (e.g., credit cards) if unpaid."
  },
  {
    field: "Personal Finance",
    title: "What’s a “backdoor Roth IRA” and who uses it?",
    content: "A two-step conversion (traditional IRA → Roth) for high earners exceeding Roth income limits, enabling tax-free growth."
  },
  {
    field: "Personal Finance",
    title: "Why check your credit report annually even if you don’t apply for loans?",
    content: "To catch errors or fraud early; inaccuracies can lower your score and raise insurance/rental costs."
  },
  {
    field: "Personal Finance",
    title: "What’s the 50/30/20 budget rule?",
    content: "Allocate 50% to needs, 30% to wants, 20% to savings/debt repayment—a simple framework for balance."
  },
  {
    field: "Personal Finance",
    title: "How does dollar-cost averaging reduce investment risk?",
    content: "Buying fixed amounts regularly averages purchase prices, avoiding timing the market and smoothing volatility."
  },
  {
    field: "Personal Finance",
    title: "Why are index funds often recommended over individual stocks for beginners?",
    content: "They offer instant diversification, lower fees, and match market returns—reducing single-stock risk."
  },
  {
    field: "Personal Finance",
    title: "What’s “lifestyle inflation” and why avoid it?",
    content: "Spending more as income rises, which delays wealth building; instead, save/invest the surplus."
  },
  {
    field: "Personal Finance",
    title: "How does tax-loss harvesting work?",
    content: "Selling losing investments to offset capital gains taxes, then reinvesting in similar (not identical) assets."
  },

  // --- Digital Marketing (10) ---
  {
    field: "Digital Marketing",
    title: "What’s the core difference between SEO and SEM?",
    content: "SEO = organic search optimization (free, long-term); SEM = paid search ads (immediate, cost-per-click)."
  },
  {
    field: "Digital Marketing",
    title: "Why is CTR (click-through rate) a key metric in ad campaigns?",
    content: "It measures ad relevance; higher CTR lowers cost-per-click and improves Quality Score in platforms like Google Ads."
  },
  {
    field: "Digital Marketing",
    title: "What’s a “buyer persona” and why create one?",
    content: "A semi-fictional profile of your ideal customer; it guides content, targeting, and messaging for better ROI."
  },
  {
    field: "Digital Marketing",
    title: "How does retargeting (remarketing) increase conversions?",
    content: "It shows ads to users who previously visited your site, reminding them to complete actions (e.g., cart checkout)."
  },
  {
    field: "Digital Marketing",
    title: "What’s the purpose of A/B testing in email marketing?",
    content: "To compare two versions (subject line, CTA) and pick the higher-performing one based on open/click rates."
  },
  {
    field: "Digital Marketing",
    title: "Why is mobile optimization critical for digital campaigns?",
    content: "Over 60% of web traffic is mobile; poor mobile experience increases bounce rates and hurts SEO rankings."
  },
  {
    field: "Digital Marketing",
    title: "What does “conversion funnel” mean in marketing?",
    content: "The journey from awareness → interest → decision → action; optimizing each stage boosts final conversions."
  },
  {
    field: "Digital Marketing",
    title: "How do influencers differ from traditional celebrities in marketing?",
    content: "Influencers have niche, engaged audiences and higher trust; celebs offer broad reach but lower engagement per follower."
  },
  {
    field: "Digital Marketing",
    title: "What’s “content marketing” vs. “advertising”?",
    content: "Content marketing provides value (blogs, videos) to attract organically; advertising pays for immediate visibility."
  },
  {
    field: "Digital Marketing",
    title: "Why track ROI (return on investment) in campaigns?",
    content: "It quantifies profit relative to spend: ROI = ((Revenue - Cost) / Cost) * 100, guiding budget decisions."
  },

  // --- History (10) ---
  {
    field: "History",
    title: "What event marked the end of the Roman Republic?",
    content: "Julius Caesar’s assassination (44 BCE) triggered civil wars, leading to Augustus becoming the first emperor (27 BCE)."
  },
  {
    field: "History",
    title: "Why was the Magna Carta (1215) revolutionary?",
    content: "It established that even kings were subject to law, laying groundwork for constitutional governance."
  },
  {
    field: "History",
    title: "What caused the fall of Constantinople in 1453?",
    content: "Ottoman cannons breached the walls, ending the Byzantine Empire and shifting trade routes to the Age of Exploration."
  },
  {
    field: "History",
    title: "How did the Printing Press (c. 1440) change Europe?",
    content: "It democratized knowledge, fueling the Renaissance, Reformation, and scientific revolution by mass-producing books."
  },
  {
    field: "History",
    title: "What was the main goal of the Congress of Vienna (1815)?",
    content: "To restore European stability post-Napoleon by redrawing borders and creating a balance of power."
  },
  {
    field: "History",
    title: "Why is the Battle of Hastings (1066) pivotal for England?",
    content: "Norman conquest introduced feudalism, French language influence, and centralized royal authority."
  },
  {
    field: "History",
    title: "What triggered the American Revolution (1775–1783)?",
    content: "“No taxation without representation”—British taxes (Stamp Act, Tea Act) without colonial consent in Parliament."
  },
  {
    field: "History",
    title: "How did the Silk Road shape global history?",
    content: "It connected Asia, Europe, and Africa, spreading goods, ideas (Buddhism, Islam), and technologies (paper, gunpowder)."
  },
  {
    field: "History",
    title: "What was the Cold War’s defining ideological conflict?",
    content: "Capitalism (USA) vs. Communism (USSR), fought via proxies, arms races, and space competition—not direct war."
  },
  {
    field: "History",
    title: "Why did the Berlin Wall fall in 1989?",
    content: "Mass protests, Soviet reforms (Glasnost), and East German policy errors led to open borders, symbolizing Cold War’s end."
  },

  // --- Biology and Life Science (10) ---
  {
    field: "Biology and Life Science",
    title: "What’s the central dogma of molecular biology?",
    content: "DNA → RNA → Protein: genetic info flows from transcription (DNA to RNA) to translation (RNA to protein)."
  },
  {
    field: "Biology and Life Science",
    title: "Why are mitochondria called the “powerhouse of the cell”?",
    content: "They produce ATP via cellular respiration, powering nearly all cellular activities."
  },
  {
    field: "Biology and Life Science",
    title: "How does natural selection drive evolution?",
    content: "Traits enhancing survival/reproduction become more common over generations, adapting populations to environments."
  },
  {
    field: "Biology and Life Science",
    title: "What’s the role of enzymes in metabolism?",
    content: "They act as biological catalysts, speeding up chemical reactions (e.g., digestion) without being consumed."
  },
  {
    field: "Biology and Life Science",
    title: "Why is biodiversity crucial for ecosystem stability?",
    content: "More species = greater resilience to disturbances (disease, climate), ensuring functions like pollination and nutrient cycling."
  },
  {
    field: "Biology and Life Science",
    title: "What distinguishes prokaryotic from eukaryotic cells?",
    content: "Prokaryotes (bacteria) lack a nucleus and organelles; eukaryotes (plants, animals) have membrane-bound compartments."
  },
  {
    field: "Biology and Life Science",
    title: "How do vaccines confer immunity?",
    content: "They expose the immune system to harmless antigens, creating memory cells for faster future response."
  },
  {
    field: "Biology and Life Science",
    title: "What’s the function of the CRISPR-Cas9 system?",
    content: "It’s a gene-editing tool that cuts DNA at precise locations, enabling targeted genetic modifications."
  },
  {
    field: "Biology and Life Science",
    title: "Why do plants perform photosynthesis?",
    content: "To convert sunlight, CO₂, and water into glucose (energy) and oxygen, sustaining most life on Earth."
  },
  {
    field: "Biology and Life Science",
    title: "What’s the significance of the human microbiome?",
    content: "Gut bacteria aid digestion, synthesize vitamins, and regulate immunity—imbalances link to diseases like obesity."
  },

  // --- Languages (10) ---
  {
    field: "Languages",
    title: "How many languages are estimated to exist worldwide today?",
    content: "Approximately 7,000, though half may vanish by 2100 due to globalization."
  },
  {
    field: "Languages",
    title: "What’s the most spoken language by total speakers (native + non-native)?",
    content: "English, driven by its role in business, science, and the internet."
  },
  {
    field: "Languages",
    title: "What is “lingua franca”?",
    content: "A common language used between speakers of different native tongues (e.g., Swahili in East Africa)."
  },
  {
    field: "Languages",
    title: "Why is Latin considered a “dead” language?",
    content: "It has no native speakers today, though it lives on in science, law, and Romance languages."
  },
  {
    field: "Languages",
    title: "What’s the difference between syntax and semantics?",
    content: "Syntax = rules for sentence structure; semantics = meaning of words/sentences."
  },
  {
    field: "Languages",
    title: "How did the Rosetta Stone help decipher hieroglyphs?",
    content: "It featured the same text in Greek, Demotic, and hieroglyphs, allowing scholars to crack the code."
  },
  {
    field: "Languages",
    title: "What’s “code-switching” in bilingual speakers?",
    content: "Alternating between languages mid-conversation, often for emphasis, identity, or context."
  },
  {
    field: "Languages",
    title: "Why is Mandarin Chinese the most spoken native language?",
    content: "China’s massive population (~1.4 billion) makes it #1 by native speakers, despite fewer total speakers than English."
  },
  {
    field: "Languages",
    title: "What’s an example of onomatopoeia across languages?",
    content: "Words mimicking sounds: “buzz” (English), “wan-wan” (Japanese for dog bark), “meow” (universal)."
  },
  {
    field: "Languages",
    title: "How do creole languages form?",
    content: "From pidgins (simplified contact languages) that become native tongues, blending vocabulary/grammar of parent languages."
  },

  // --- Nutrition (10) ---
  {
    field: "Nutrition",
    title: "What’s the difference between macronutrients and micronutrients?",
    content: "Macros (carbs, proteins, fats) provide energy; micros (vitamins, minerals) support bodily functions in small amounts."
  },
  {
    field: "Nutrition",
    title: "Why is dietary fiber important?",
    content: "It regulates bowel movements, lowers cholesterol, and feeds beneficial gut bacteria."
  },
  {
    field: "Nutrition",
    title: "What’s the “sunshine vitamin” and why?",
    content: "Vitamin D—synthesized by skin in sunlight; crucial for calcium absorption and bone health."
  },
  {
    field: "Nutrition",
    title: "How many calories are in 1g of fat vs. 1g of protein?",
    content: "Fat = 9 kcal/g; protein = 4 kcal/g (same as carbs)."
  },
  {
    field: "Nutrition",
    title: "What’s the recommended daily water intake for adults?",
    content: "About 2 liters (8 cups), varying by climate, activity, and health."
  },
  {
    field: "Nutrition",
    title: "Why are omega-3 fatty acids essential?",
    content: "They reduce inflammation, support brain/heart health, and must come from diet (e.g., salmon, flaxseeds)."
  },
  {
    field: "Nutrition",
    title: "What’s the role of antioxidants?",
    content: "They neutralize free radicals, preventing cellular damage linked to aging and chronic diseases."
  },
  {
    field: "Nutrition",
    title: "How does protein support muscle repair?",
    content: "Amino acids from protein rebuild muscle fibers damaged during exercise, promoting growth."
  },
  {
    field: "Nutrition",
    title: "What’s “hidden sugar” in processed foods?",
    content: "Added sugars under names like high-fructose corn syrup, dextrose, or maltose, inflating calorie counts."
  },
  {
    field: "Nutrition",
    title: "Why limit trans fats?",
    content: "They raise bad LDL cholesterol, lower good HDL, and increase heart disease risk—found in fried/processed foods."
  },

  // --- Cooking (10) ---
  {
    field: "Cooking",
    title: "What’s the Maillard reaction?",
    content: "A chemical browning process between amino acids and sugars at high heat, creating complex flavors (e.g., seared steak)."
  },
  {
    field: "Cooking",
    title: "Why rest meat after cooking?",
    content: "Juices redistribute, preventing dryness when sliced—especially critical for roasts and steaks."
  },
  {
    field: "Cooking",
    title: "What’s the purpose of “blooming” spices?",
    content: "Heating spices in oil releases fat-soluble flavors, intensifying aroma and taste in curries/stews."
  },
  {
    field: "Cooking",
    title: "How does acid (lemon/vinegar) tenderize meat?",
    content: "It denatures proteins, breaking down tough fibers—used in marinades for ceviche or adobo."
  },
  {
    field: "Cooking",
    title: "Why use cold butter in pie crusts?",
    content: "Cold fat creates steam pockets during baking, yielding flaky layers instead of dense dough."
  },
  {
    field: "Cooking",
    title: "What’s “deglazing” a pan?",
    content: "Adding liquid (wine, broth) to a hot pan to dissolve browned bits (fond), forming a flavorful sauce base."
  },
  {
    field: "Cooking",
    title: "How does salt enhance flavor beyond just “salty”?",
    content: "It suppresses bitterness and amplifies sweetness/savory notes, balancing overall taste."
  },
  {
    field: "Cooking",
    title: "Why soak beans before cooking?",
    content: "Reduces cooking time and oligosaccharides that cause gas, improving digestibility."
  },
  {
    field: "Cooking",
    title: "What’s the difference between baking and roasting?",
    content: "Baking = lower temps for breads/cakes; roasting = higher temps for meats/veggies to caramelize surfaces."
  },
  {
    field: "Cooking",
    title: "How does yeast make dough rise?",
    content: "It ferments sugars, producing CO₂ gas that traps in gluten networks, expanding the dough."
  },

  // --- Gaming (10) ---
  {
    field: "Gaming",
    title: "What was the first commercially successful video game?",
    content: "Pong (1972) by Atari, though Computer Space (1971) was the first arcade video game."
  },
  {
    field: "Gaming",
    title: "Why are “loot boxes” controversial?",
    content: "They resemble gambling—random rewards for real money, raising concerns about addiction, especially in minors."
  },
  {
    field: "Gaming",
    title: "What’s the difference between FPS and TPS games?",
    content: "FPS = first-person shooter (view through character’s eyes); TPS = third-person shooter (camera behind character)."
  },
  {
    field: "Gaming",
    title: "How do esports differ from casual gaming?",
    content: "Esports = professional, organized competitions with teams, sponsors, and prize pools; casual = recreational play."
  },
  {
    field: "Gaming",
    title: "What’s “frame rate” (FPS) and why does it matter?",
    content: "Frames per second; higher FPS = smoother motion, critical for competitive gaming responsiveness."
  },
  {
    field: "Gaming",
    title: "Why do games use “save points”?",
    content: "To let players progress without losing all progress on death, balancing challenge and accessibility."
  },
  {
    field: "Gaming",
    title: "What’s the “Konami Code” and its origin?",
    content: "↑↑↓↓←→←→BA; created for Gradius (1986) to give extra lives, now a pop-culture Easter egg."
  },
  {
    field: "Gaming",
    title: "How does VR (virtual reality) enhance immersion?",
    content: "Headsets track head/hand movements, placing players inside 3D environments with 360° vision."
  },
  {
    field: "Gaming",
    title: "What’s a “speedrun” in gaming?",
    content: "Completing a game as fast as possible, often using glitches/shortcuts, with categories like “any%” or “100%”."
  },
  {
    field: "Gaming",
    title: "Why are indie games significant in the industry?",
    content: "They innovate with unique mechanics/stories (e.g., Hades, Stardew Valley), challenging AAA studio conventions."
  },

  // --- Anime and Manga (10) ---
  {
    field: "Anime and Manga",
    title: "What’s the difference between shonen and shojo manga?",
    content: "Shonen = targeted at teen boys (action, friendship); shojo = teen girls (romance, emotions)."
  },
  {
    field: "Anime and Manga",
    title: "Who created Astro Boy, the foundational manga character?",
    content: "Osamu Tezuka (1952), often called the “God of Manga.”"
  },
  {
    field: "Anime and Manga",
    title: "What does “isekai” mean in anime?",
    content: "“Another world”—protagonists transported/reborn into fantasy realms (e.g., Re:Zero, Sword Art Online)."
  },
  {
    field: "Anime and Manga",
    title: "Why is Dragon Ball Z iconic globally?",
    content: "It popularized power-scaling battles, transformations (Super Saiyan), and inspired countless shonen series."
  },
  {
    field: "Anime and Manga",
    title: "What’s a “filler episode” in anime?",
    content: "Non-canon content added to avoid overtaking the manga, often criticized for slowing pacing."
  },
  {
    field: "Anime and Manga",
    title: "How did Akira (1988) impact anime?",
    content: "Its cinematic quality and mature themes broke Western stereotypes, paving the way for global acceptance."
  },
  {
    field: "Anime and Manga",
    title: "What’s the “Big Three” of 2000s shonen anime?",
    content: "Naruto, One Piece, Bleach—dominating Weekly Shonen Jump and global fandoms."
  },
  {
    field: "Anime and Manga",
    title: "Why do manga use right-to-left reading in English releases?",
    content: "To preserve original Japanese panel flow and artistic intent, avoiding costly reformatting."
  },
  {
    field: "Anime and Manga",
    title: "What’s “mecha” anime?",
    content: "Features giant robots (e.g., Gundam, Evangelion), exploring war, technology, and human identity."
  },
  {
    field: "Anime and Manga",
    title: "How did streaming change anime distribution?",
    content: "Platforms like Crunchyroll enabled simulcasts (same-day Japan releases), boosting global accessibility."
  },

  // --- Fashion (10) ---
  {
    field: "Fashion",
    title: "What’s “haute couture” and who regulates it?",
    content: "Custom-fitted, handcrafted fashion; legally protected in France by the Chambre Syndicale de la Haute Couture."
  },
  {
    field: "Fashion",
    title: "Who popularized the “little black dress”?",
    content: "Coco Chanel (1926), making it a timeless symbol of elegance and versatility."
  },
  {
    field: "Fashion",
    title: "What’s the difference between “bespoke” and “ready-to-wear”?",
    content: "Bespoke = custom-made for one client; ready-to-wear = mass-produced in standard sizes."
  },
  {
    field: "Fashion",
    title: "Why is Milan a fashion capital?",
    content: "Home to luxury brands (Gucci, Prada) and Milan Fashion Week, blending craftsmanship with innovation."
  },
  {
    field: "Fashion",
    title: "What fabric comes from flax plants?",
    content: "Linen—breathable, durable, and prized for summer clothing."
  },
  {
    field: "Fashion",
    title: "Who created the iconic “wrap dress”?",
    content: "Diane von Fürstenberg (1974), celebrated for its flattering, versatile design."
  },
  {
    field: "Fashion",
    title: "What’s “streetwear” in fashion?",
    content: "Casual, urban-inspired style (hoodies, sneakers) rooted in skate/hip-hop culture, now mainstream luxury."
  },
  {
    field: "Fashion",
    title: "Which designer is known for red-soled shoes?",
    content: "Christian Louboutin—his stilettos became a status symbol in the 1990s."
  },
  {
    field: "Fashion",
    title: "What’s a “capsule collection”?",
    content: "A limited, cohesive line released outside regular seasons, often for exclusivity or collaborations."
  },
  {
    field: "Fashion",
    title: "How did the Met Gala become “fashion’s biggest night”?",
    content: "It’s a fundraising gala for the Met’s Costume Institute, where celebrities showcase avant-garde themed outfits."
  },

  // --- Sports (10) ---
  {
    field: "Sports",
    title: "Who holds the MLB record for most home runs in a season?",
    content: "Barry Bonds (73 in 2001), though controversy surrounds steroid allegations."
  },
  {
    field: "Sports",
    title: "What’s the longest point in tennis history?",
    content: "29 minutes (1984 exhibition match between Vicki Nelson and Jean Hepner)."
  },
  {
    field: "Sports",
    title: "Which NFL team has never played in or hosted a Super Bowl?",
    content: "Cleveland Browns (as of 2025)."
  },
  {
    field: "Sports",
    title: "When was the first NBA game played?",
    content: "November 1, 1946 (New York Knicks vs. Toronto Huskies)."
  },
  {
    field: "Sports",
    title: "Who was the first U.S. president to throw a ceremonial first pitch?",
    content: "William Howard Taft (1910, Washington Senators game)."
  },
  {
    field: "Sports",
    title: "What’s the “Triple Crown” in horse racing?",
    content: "Winning the Kentucky Derby, Preakness Stakes, and Belmont Stakes in one year."
  },
  {
    field: "Sports",
    title: "How many rings make a “Grand Slam” in tennis?",
    content: "Four—Australian Open, French Open, Wimbledon, US Open in a calendar year."
  },
  {
    field: "Sports",
    title: "What’s the maximum break in snooker?",
    content: "147 points (15 reds + 15 blacks + all colors), achieved ~200 times professionally."
  },
  {
    field: "Sports",
    title: "Who won India’s first individual Olympic gold in athletics?",
    content: "Neeraj Chopra (javelin, Tokyo 2020)."
  },
  {
    field: "Sports",
    title: "What’s “offside” in soccer?",
    content: "An attacker is nearer to the goal than the second-last defender when the ball is played, halting play."
  }
];

console.log(`Total questions to upload: ${questions.length}`);

async function run() {
  const cookieHeader = `rqna_token=${token}; edu_token=${token}`;
  let successCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const postRes = await fetch('http://localhost:3000/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        title: q.title,
        content: q.content,
        field: q.field,
        imageUrl: null,
        videoUrl: null
      })
    });

    const postData = await postRes.json();
    if (!postRes.ok || !postData.success) {
      console.error(`Failed to post [${q.field}] "${q.title}":`, postData);
    } else {
      successCount++;
      if (successCount % 10 === 0 || successCount === questions.length) {
        console.log(`Progress: ${successCount}/${questions.length} posted. (Latest: [${q.field}] ${q.title})`);
      }
    }
  }

  console.log(`\nCOMPLETED: Successfully posted ${successCount} of ${questions.length} questions as @abhayraj (ABHAY R SINGH).`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
