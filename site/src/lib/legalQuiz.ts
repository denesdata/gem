import type { Locale } from '@/lib/types'

export type LegalForm = 'pfa' | 'srl'
export type QuizDest = LegalForm | 'next'

type Copy = Record<Locale, string>

export interface QuizQuestion {
  id: string
  question: Copy
  short: Copy
  hint: Copy
  yes: QuizDest
  no: QuizDest
  link?: { href: string; label: string }
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'employees',
    question: {
      en: 'Do you want more than three employees?',
      ro: 'Doriți să aveți mai mult de 3 salariați?',
      hu: 'Szeretne háromnál több alkalmazottat?',
    },
    short: {
      en: 'More than three employees',
      ro: 'Peste 3 salariați',
      hu: 'Háromnál több alkalmazott',
    },
    hint: {
      en: 'A sole trader can hire at most three people. More than that means an LLC.',
      ro: 'Persoana fizică autorizată poate încheia contract individual de muncă cu maximum 3 salariați. Peste acest prag trebuie un SRL.',
      hu: 'Az engedélyezett természetes személy legfeljebb három fővel köthet munkaszerződést. Több alkalmazotthoz KFT kell.',
    },
    yes: 'srl',
    no: 'next',
  },
  {
    id: 'activities',
    question: {
      en: 'Do you want more than five activities?',
      ro: 'Doriți să vă ocupați cu mai mult de 5 activități?',
      hu: 'Szeretne ötnél több tevékenységet folytatni?',
    },
    short: {
      en: 'More than five activities',
      ro: 'Peste 5 activități',
      hu: 'Ötnél több tevékenység',
    },
    hint: {
      en: 'A PFA may list only five CAEN classes. Check the codes before you decide.',
      ro: 'PFA-ul poate avea în obiectul de activitate doar 5 clase CAEN. Consultați lista înainte de a decide.',
      hu: 'Az ETSZ csak öt TEÁOR-osztályt vihet. Nézze át a kódokat a döntés előtt.',
    },
    yes: 'srl',
    no: 'next',
    link: { href: 'https://www.caen.ro', label: 'CAEN' },
  },
  {
    id: 'own-work',
    question: {
      en: 'Will the business rest mainly on your own work?',
      ro: 'Doriți să vă bazați activitatea în principal pe propria forță de muncă?',
      hu: 'A tevékenység elsősorban a saját munkáján múlik?',
    },
    short: {
      en: 'Mostly your own work',
      ro: 'În principal munca dvs.',
      hu: 'Főként saját munka',
    },
    hint: {
      en: 'An LLC is still allowed. If the value is your skill and time, a PFA is usually the lighter fit.',
      ro: 'Un SRL rămâne posibil. Dacă valoarea stă în cunoștințele și munca dvs., un PFA e de obicei mai potrivit.',
      hu: 'KFT továbbra is lehetséges. Ha a tudása és a munkája a fő érték, az ETSZ általában könnyebb.',
    },
    yes: 'pfa',
    no: 'next',
  },
  {
    id: 'partners',
    question: {
      en: 'Do you want to run it with partners?',
      ro: 'Doriți să conduceți afacerea cu mai mulți asociați?',
      hu: 'Több taggal szeretné működtetni?',
    },
    short: {
      en: 'With partners',
      ro: 'Cu asociați',
      hu: 'Több taggal',
    },
    hint: {
      en: 'A PFA has a single holder. Associates require an LLC.',
      ro: 'PFA-ul are un singur titular. Asociații cer un SRL.',
      hu: 'Az ETSZ-nek egy tulajdonosa van. Társakhoz KFT kell.',
    },
    yes: 'srl',
    no: 'next',
  },
  {
    id: 'test-idea',
    question: {
      en: 'Are you testing an idea you are not yet sure about?',
      ro: 'Doriți să testați o idee de afaceri de care nu sunteți încă sigur?',
      hu: 'Egy még bizonytalan üzleti ötletet tesztelne?',
    },
    short: {
      en: 'Testing an idea',
      ro: 'Testarea unei idei',
      hu: 'Ötlet tesztelése',
    },
    hint: {
      en: 'A PFA opens and closes more easily. Many founders test under a PFA, then found an LLC once it works.',
      ro: 'PFA-ul se înființează și se închide mai ușor. Mulți testează ideea pe PFA, apoi trec la SRL când funcționează.',
      hu: 'Az ETSZ könnyebben nyitható és zárható. Sokan ETSZ-en tesztelnek, majd KFT-t alapítanak, ha beválik.',
    },
    yes: 'pfa',
    no: 'next',
  },
  {
    id: 'side-job',
    question: {
      en: 'Do you already have a job and want to offer a service beside it?',
      ro: 'Aveți o profesie și doriți să prestați un serviciu pe lângă job?',
      hu: 'Van állása, és mellette szeretne szolgáltatást nyújtani?',
    },
    short: {
      en: 'Beside an existing job',
      ro: 'Pe lângă un job',
      hu: 'Munka mellett',
    },
    hint: {
      en: 'A PFA is lighter to keep on the side. If this is the main vehicle, an LLC is the usual next step.',
      ro: 'PFA-ul e mai ușor de ținut pe lângă un job. Dacă aceasta e afacerea principală, SRL-ul e pasul obișnuit.',
      hu: 'Az ETSZ könnyebben vihető munka mellett. Ha ez a fő jármű, a KFT a szokásos következő lépés.',
    },
    yes: 'pfa',
    no: 'srl',
  },
]

export const QUIZ_RESULT = {
  pfa: {
    kicker: { en: 'Recommended', ro: 'Recomandat', hu: 'Ajánlott' },
    title: {
      en: 'Sole trader (PFA)',
      ro: 'Persoană Fizică Autorizată',
      hu: 'Engedélyezett természetes személy',
    },
    blurb: {
      en: 'A lighter form for work that sits on your own skill, with simpler books and a quicker start.',
      ro: 'Formă mai ușoară când valoarea e munca dvs.: contabilitate mai simplă și start mai rapid.',
      hu: 'Könnyebb forma, ha a saját tudása a fő érték: egyszerűbb könyvelés, gyorsabb indítás.',
    },
  },
  srl: {
    kicker: { en: 'Recommended', ro: 'Recomandat', hu: 'Ajánlott' },
    title: {
      en: 'Limited liability company (SRL)',
      ro: 'Societate cu Răspundere Limitată',
      hu: 'Korlátolt Felelősségű Társaság',
    },
    blurb: {
      en: 'The company is its own person. Liability stays with the firm, and you can hire, associate, and grow.',
      ro: 'Societatea e o persoană juridică distinctă. Răspunderea stă la firmă; puteți angaja, asocia și crește.',
      hu: 'A cég külön jogi személy. A felelősség a társaságé; alkalmazhat, társulhat és nőhet.',
    },
  },
}

export const FORM_SNAPSHOT = {
  pfa: {
    intro: {
      en: 'Not a company: a natural person selling their own skill. The main asset is your work.',
      ro: 'Nu este o societate, ci o persoană fizică care își vinde meseria. Principalul activ e munca dvs.',
      hu: 'Nem cég: természetes személy, aki a saját tudását értékesíti. A fő érték a munkája.',
    },
    plus: {
      en: ['Faster and cheaper to open', 'You can keep the books yourself', 'Income is yours to use', 'Useful tax treatment in some cases'],
      ro: ['Înființare mai ușoară și mai ieftină', 'Contabilitatea o puteți ține singur', 'Veniturile vă stau la dispoziție', 'Beneficii fiscale în unele cazuri'],
      hu: ['Gyorsabb és olcsóbb nyitás', 'A könyvelést Ön is viheti', 'A bevétel közvetlenül az Öné', 'Adóelőny egyes esetekben'],
    },
    minus: {
      en: ['At most 3 employees', 'At most 5 CAEN classes', 'Unlimited personal liability — your whole patrimony'],
      ro: ['Maximum 3 salariați', 'Maximum 5 clase CAEN', 'Răspundere nelimitată, cu tot patrimoniul personal'],
      hu: ['Legfeljebb 3 alkalmazott', 'Legfeljebb 5 TEÁOR-osztály', 'Korlátlan személyes felelősség a teljes vagyonnal'],
    },
    time: {
      en: 'Usually 3–4 days after filing. Incomplete files get 15 days. Track status at myportal.onrc.ro.',
      ro: 'De obicei 3–4 zile după depunere. Dosarul incomplet primește 15 zile. Status: myportal.onrc.ro.',
      hu: 'Általában 3–4 nap a benyújtás után. Hiányos iratnál 15 nap. Státusz: myportal.onrc.ro.',
    },
  },
  srl: {
    intro: {
      en: 'A legal person with its own patrimony. The firm — not you personally — stands behind the debts.',
      ro: 'Persoană juridică cu patrimoniu propriu. Firma — nu dvs. personal — stă în spatele datoriilor.',
      hu: 'Önálló vagyonú jogi személy. A tartozások mögött a cég áll, nem Ön személyesen.',
    },
    plus: {
      en: ['Unlimited activities', 'Up to 50 members', 'Unlimited employees', 'Liability capped at the company'],
      ro: ['Activități nelimitate', 'Până la 50 de asociați', 'Salariați nelimitați', 'Răspundere limitată la societate'],
      hu: ['Korlátlan tevékenység', 'Legfeljebb 50 tag', 'Korlátlan alkalmazott', 'Felelősség a cég vagyonáig'],
    },
    minus: {
      en: ['More paperwork and cost to open', 'You need an accountant', 'You cannot spend company money as if it were yours'],
      ro: ['Mai multe formalități și costuri la start', 'Aveți nevoie de contabil', 'Veniturile nu se cheltuie ca bani personali'],
      hu: ['Több formaiság és költség a nyitáskor', 'Könyvelő kell', 'A cég pénze nem személyes költőpénz'],
    },
    time: {
      en: 'Usually 3–4 days after filing. Incomplete files get 15 days. Track status at myportal.onrc.ro.',
      ro: 'De obicei 3–4 zile după depunere. Dosarul incomplet primește 15 zile. Status: myportal.onrc.ro.',
      hu: 'Általában 3–4 nap a benyújtás után. Hiányos iratnál 15 nap. Státusz: myportal.onrc.ro.',
    },
  },
}
