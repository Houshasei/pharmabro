// Bisaya humor injector - adds light Bisaya analogies and one-liners
// to make review explanations more fun and memorable.

const TAGS = [
  "Lagi uy",
  "Te tan-awa ni",
  "Sabta ni gud",
  "Kuyaw kaayo ni",
  "Mao kini ang sekreto",
  "Hala, tan-awa",
  "Pareho ra ni sa",
  "Sayon ra ni",
  "Pag-isip lang gyud",
  "Memorize gyud ni",
];

const CLOSINGS = [
  "Padayon, ikaw na ang next na RPh!",
  "Lapas-lapas lang sa Boards, kayang-kaya!",
  "Tagam ka aning question, sus.",
  "Sigeg basa, brad/sis!",
  "Wala'y problema kung nakahuna-huna lang.",
  "Imong utok karon, gamit-gamita.",
  "Padayon gyud, di ka unsa ana!",
  "Pagkat-on man, di mag-give up!",
];

const ANALOGIES_BY_KEYWORD = {
  enzyme: "Ang enzyme parehas sa cook sa karenderya — paspasan niya ang luto pero dili siya maapil sa final dish.",
  catalyst: "Ang catalyst murag matchmaker — magpaila lang sa reactants, di siya ma-consume.",
  membrane: "Ang cell membrane sama sa bouncer sa club — pili-pili kung kinsay paadtuon sulod ug gawas.",
  mitochondria: "Mitochondria mao ang gen-set sa balay — kung mahurot ang krudo (ATP), mura'g brownout ang cell.",
  acid: "Ang acid mura'g sungog — gusto gyud mag-donate og proton bisag walay nangayo.",
  base: "Ang base murag pasagdan na sangko sa basurahan — andam mosalo (proton).",
  buffer: "Buffer mura'g referee sa basketball — magbantay nga di mausab ang pH bisag dunay gubot.",
  ionization: "Ionization parehas kung mag-divorce ang naa'y kuyog — magsumpaki ang ion negative ug positive.",
  hypertonic: "Hypotonic mura'g uhaw na uhaw ang cell — mag-suyop dayon og tubig hangtod mokabuto.",
  isotonic: "Isotonic mura'g jowa nga balanced ang give and take — walay net movement, walay sapot.",
  hypotonic: "Hypotonic = lots of water outside (lower solute) — cell swells. Mura'g over-hydrated nga papaya.",
  glycolysis: "Glycolysis mura'g magdivide og mantikilya sa pan de sal — ang glucose mahimong duha ka pyruvate.",
  protein: "Ang protein synthesis murag pag-luto sa lechon — naa'y blueprint (mRNA), naa'y chef (ribosome), naa'y meat (amino acids).",
  dna: "DNA mura'g family Bible — naa didto tanang surnames sa imong pamilya, pero copy ra ang gigamit sa adlaw-adlaw.",
  receptor: "Receptor mura'g doorbell — kung tama ang yawi (drug), maabri ang pultahan.",
  agonist: "Agonist murag tinood na bisita — mo-knock dayon mosulod sa cell.",
  antagonist: "Antagonist murag KJ na bisita — moadto sa pultahan pero di mosulod, dili sad ipasulod ang uban.",
  metabolism: "Metabolism mura'g pag-recycle sa basura — ang dili gamit i-convert ngadto sa gamit, o ipalabay.",
  excretion: "Excretion mura'g pag-throw out sa nadunot na kan-on — kung di nimo igawas, mahimo'g toxin.",
  osmosis: "Osmosis = tubig moadto kung asa daghan ang asin. Mura ka sa kindergarten kid nga moadto kung asa ang kendi.",
  diffusion: "Diffusion = ang amoy sa adobo molamba sa kwarto kung dunay daghan didto. Wala'y energy gigamit.",
  half: "Half-life mura'g kape sa kapelmiryena — every certain hours, mawala ang half. Sigeg balik-balik.",
  alkaloid: "Alkaloid mura'g pari nga dili magpadala — basic ang ulo, mapait pa ang baba.",
  glycoside: "Glycoside = sugar + non-sugar moment. Mura'g jowa nga mag-uban bisag lain-lain og pamilya.",
  vitamin: "Vitamin mura'g spice — gamay lang ang kinahanglan, pero kung kulang, lasaw imong lawas.",
  tablet: "Tablet murag pan de sal — compressed ang harina, easy to dose, easy to dispense.",
  capsule: "Capsule murag siopao — naa sulod nga taste mo, daling tunlon kay smooth ang gawas.",
  syrup: "Syrup mura'g basa nga maja — daghan asukar, makapanunot sa bata.",
  emulsion: "Emulsion mura'g mayonnaise — duha ka liquid (oil ug water) nga di mag-uyon, kinahanglan og emulsifier.",
  suspension: "Suspension mura'g sabaw nga dunay gamay nga uga — kinahanglan i-shake usa moinom. Wala'y dissolve.",
  solution: "Solution mura'g tagay nga ron coke — pure ang sagol, di kinahanglan i-shake.",
  excretion_kidney: "Ang kidney mura'g washing machine — i-filter ang dugo, ang dunot ibutang sa ihi.",
  liver: "Liver mura'g recycling plant — modetoxify sa makahilo, mo-package sa nutrients.",
  binding: "Protein binding mura'g jowa nga kupot-kupot — kung dako ang binding, gamay ra ang free drug.",
  absorption: "Absorption mura'g pagsuyop sa straw — ang drug moagi sa GI tract padulong sa dugo.",
  distribution: "Distribution mura'g pamigay og PAG-IBIG benefits — i-spread sa lainlaing tissue ang drug.",
  fda: "FDA mura'g titser sa school — sila ang mag-approve kung ang drug pwede o dili.",
  ppm: "PPM = parts per million. Mura'g pangita og isa ka tibod sa basurahan sa SM City.",
  ppb: "PPB = parts per billion. Mura'g pangita og isa ka grain of rice sa baybayon.",
};

// Pick analogy from question/answer/rationale keywords
export function pickAnalogy(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [kw, line] of Object.entries(ANALOGIES_BY_KEYWORD)) {
    if (lower.includes(kw)) return line;
  }
  return null;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function decorateRationale(rationale, q) {
  const analogy = pickAnalogy(`${q.question} ${q.answer_text} ${q.rationale}`);
  const tag = pick(TAGS);
  const closing = pick(CLOSINGS);
  const base = rationale && rationale.trim() ? rationale.trim()
    : `Ang sakto nga tubag kay ${q.answer}. ${q.answer_text}.`;
  if (!analogy) {
    return { main: base, bisaya: `${tag} — ${closing}` };
  }
  return { main: base, bisaya: `${tag} — ${analogy} ${closing}` };
}
