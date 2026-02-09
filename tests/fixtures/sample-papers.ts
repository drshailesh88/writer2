import type { PaperData } from "@/lib/bibliography";

// Realistic medical research papers with varying metadata completeness
export const samplePapers: PaperData[] = [
  // 1. NEJM paper — 3 authors, complete metadata
  {
    _id: "paper_nejm_1",
    title:
      "Intensive Blood-Pressure Lowering in Patients with Acute Cerebral Hemorrhage",
    authors: ["Craig S Anderson", "Emma Heeley", "Yining Huang"],
    journal: "New England Journal of Medicine",
    year: 2013,
    doi: "10.1056/NEJMoa1214609",
    metadata: { volume: "368", issue: "25", pages: "2355-2365" },
  },
  // 2. Lancet paper — 8 authors (et al. truncation test), complete
  {
    _id: "paper_lancet_1",
    title:
      "Canagliflozin and Renal Outcomes in Type 2 Diabetes and Nephropathy",
    authors: [
      "Vlado Perkovic",
      "Meg J Jardine",
      "Bruce Neal",
      "Severine Bompoint",
      "Hiddo J L Heerspink",
      "David C Wheeler",
      "Kenneth W Mahaffey",
      "Dick de Zeeuw",
    ],
    journal: "The New England Journal of Medicine",
    year: 2019,
    doi: "10.1056/NEJMoa1811744",
    metadata: { volume: "380", issue: "24", pages: "2295-2306" },
  },
  // 3. JAMA paper — 5 authors
  {
    _id: "paper_jama_1",
    title:
      "Association of Body Mass Index and Age With Morbidity and Mortality in Patients With Coronavirus Disease 2019",
    authors: [
      "Jennifer L Lighter",
      "Michael Phillips",
      "Sarah Hochman",
      "Stephanie Sterling",
      "Diane Johnson",
    ],
    journal: "JAMA",
    year: 2020,
    doi: "10.1001/jama.2020.12631",
    metadata: { volume: "324", issue: "2", pages: "168-177" },
  },
  // 4. Single author paper
  {
    _id: "paper_single_author",
    title: "The epidemiology of heart failure: the Framingham Study",
    authors: ["Kannel WB"],
    journal: "Journal of the American College of Cardiology",
    year: 1993,
    doi: "10.1016/0735-1097(93)90475-G",
    metadata: { volume: "22", issue: "4 Suppl A", pages: "6A-13A" },
  },
  // 5. Paper with NO DOI
  {
    _id: "paper_no_doi",
    title:
      "Diagnosis and management of acute kidney injury in the critically ill",
    authors: ["Ravindra L Mehta", "John A Kellum"],
    journal: "Critical Care Medicine",
    year: 2011,
    metadata: { volume: "39", issue: "7", pages: "1579-1585" },
  },
  // 6. Paper with NO journal (preprint)
  {
    _id: "paper_no_journal",
    title: "Attention Is All You Need",
    authors: [
      "Ashish Vaswani",
      "Noam Shazeer",
      "Niki Parmar",
      "Jakob Uszkoreit",
      "Llion Jones",
      "Aidan N Gomez",
      "Lukasz Kaiser",
      "Illia Polosukhin",
    ],
    year: 2017,
    doi: "10.48550/arXiv.1706.03762",
  },
  // 7. Paper with 2 authors
  {
    _id: "paper_two_authors",
    title: "Deep Learning in Medical Image Analysis",
    authors: ["Geert Litjens", "Thijs Kooi"],
    journal: "Medical Image Analysis",
    year: 2017,
    doi: "10.1016/j.media.2017.07.005",
    metadata: { volume: "42", pages: "60-88" },
  },
  // 8. Paper with NO year
  {
    _id: "paper_no_year",
    title: "Emerging therapies in cardiology: a comprehensive review",
    authors: ["Maria Garcia", "Robert Kim", "Sarah Chen"],
    journal: "Cardiology Review",
  },
  // 9. Nature paper — 7+ authors
  {
    _id: "paper_nature_1",
    title: "Human genome sequence assembly and annotation",
    authors: [
      "Eric S Lander",
      "Lauren M Linton",
      "Bruce Birren",
      "Chad Nusbaum",
      "Michael C Zody",
      "Jennifer Baldwin",
      "Keri Devon",
      "Ken Dewar",
      "Michael Doyle",
      "William FitzHugh",
    ],
    journal: "Nature",
    year: 2001,
    doi: "10.1038/35057062",
    metadata: { volume: "409", issue: "6822", pages: "860-921" },
  },
  // 10. JACC paper — complete with URL fallback
  {
    _id: "paper_jacc_1",
    title:
      "Percutaneous Coronary Intervention Versus Coronary Artery Bypass Grafting",
    authors: [
      "Patrick W Serruys",
      "Marie-Claude Morice",
      "A Pieter Kappetein",
    ],
    journal: "Journal of the American College of Cardiology",
    year: 2009,
    doi: "10.1016/j.jacc.2009.06.001",
    url: "https://www.jacc.org/doi/10.1016/j.jacc.2009.06.001",
    metadata: { volume: "53", issue: "24", pages: "2282-2293" },
  },
];
