import type { Entry, Project, User } from '../types'

export const MOCK_USER: User = {
  id: 'u1',
  email: 'danil@otaska.com',
  name: 'Danil',
  city: 'Bratislava',
  verified: true,
  created_at: '2026-06-01T10:00:00Z',
}

export const MOCK_ENTRIES: Entry[] = [
  {
    id: 'e1',
    client_id: 'u1',
    title: 'Шукаю електрика для квартири',
    description: 'Потрібно замінити проводку в 3-кімнатній квартирі. Панельний будинок, 70м².',
    intent_type: 'seeking_service',
    entry_type: 'on_demand',
    status: 'open',
    category: 'electric',
    city: 'Bratislava',
    budget_min: 300,
    budget_max: 600,
    ai_urgency: 'medium',
    created_at: '2026-06-28T09:00:00Z',
    proposal_count: 3,
  },
  {
    id: 'e2',
    client_id: 'u1',
    title: 'Ремонт ванної кімнати',
    description: 'Укладання плитки, встановлення сантехніки. Площа 6м².',
    intent_type: 'seeking_service',
    entry_type: 'project',
    status: 'matched',
    category: 'tiling',
    city: 'Bratislava',
    budget_min: 800,
    budget_max: 1500,
    ai_urgency: 'low',
    created_at: '2026-06-25T14:00:00Z',
    proposal_count: 5,
  },
  {
    id: 'e3',
    client_id: 'u1',
    title: 'Потрібен щебінь 20т',
    description: 'Фракція 20-40мм, доставка в Petržalka.',
    intent_type: 'seeking_material',
    entry_type: 'on_demand',
    status: 'done',
    category: 'materials',
    city: 'Bratislava',
    budget_min: 400,
    budget_max: 500,
    ai_urgency: 'high',
    created_at: '2026-06-10T08:00:00Z',
    proposal_count: 2,
  },
]

export const MOCK_BROWSE_ENTRIES: Entry[] = [
  {
    id: 'b1',
    client_id: 'u2',
    title: 'Потрібен маляр для офісу',
    description: 'Фарбування стін в офісі, 120м². Білий колір, 2 шари.',
    intent_type: 'seeking_service',
    entry_type: 'on_demand',
    status: 'open',
    category: 'painting',
    city: 'Bratislava',
    budget_min: 500,
    budget_max: 900,
    ai_urgency: 'high',
    created_at: '2026-06-29T07:00:00Z',
    proposal_count: 0,
    client: { id: 'u2', name: 'Martin K.', email: '', verified: true, created_at: '' },
  },
  {
    id: 'b2',
    client_id: 'u3',
    title: 'Роблю електрику — доступний з понеділка',
    description: 'Електромонтажні роботи будь-якої складності. Досвід 8 років.',
    intent_type: 'offering_service',
    entry_type: 'on_demand',
    status: 'open',
    category: 'electric',
    city: 'Bratislava',
    budget_min: 80,
    budget_max: 150,
    ai_urgency: 'low',
    created_at: '2026-06-29T06:00:00Z',
    proposal_count: 0,
    client: { id: 'u3', name: 'Олексій М.', email: '', verified: true, created_at: '' },
  },
  {
    id: 'b3',
    client_id: 'u4',
    title: 'Шукаю роботу будівельника',
    description: 'Досвід 5 років в загальнобудівельних роботах. Є всі інструменти.',
    intent_type: 'seeking_job',
    entry_type: 'on_demand',
    status: 'open',
    category: 'labor',
    city: 'Bratislava',
    budget_min: 60,
    budget_max: 80,
    ai_urgency: 'medium',
    created_at: '2026-06-28T15:00:00Z',
    proposal_count: 1,
    client: { id: 'u4', name: 'Iван С.', email: '', verified: false, created_at: '' },
  },
  {
    id: 'b4',
    client_id: 'u5',
    title: 'Потрібен сантехнік терміново',
    description: 'Протікає труба під раковиною. Потрібна швидка допомога.',
    intent_type: 'seeking_service',
    entry_type: 'on_demand',
    status: 'open',
    category: 'plumbing',
    city: 'Bratislava',
    budget_min: 50,
    budget_max: 150,
    ai_urgency: 'high',
    created_at: '2026-06-29T08:30:00Z',
    proposal_count: 4,
    client: { id: 'u5', name: 'Jana P.', email: '', verified: true, created_at: '' },
  },
  {
    id: 'b5',
    client_id: 'u6',
    title: 'Потрібен пісок та цемент для фундаменту',
    description: 'Пісок 10т, цемент М400 50 мішків. Доставка Rača.',
    intent_type: 'seeking_material',
    entry_type: 'on_demand',
    status: 'open',
    category: 'materials',
    city: 'Bratislava',
    budget_min: 600,
    budget_max: 800,
    ai_urgency: 'medium',
    created_at: '2026-06-27T11:00:00Z',
    proposal_count: 2,
    client: { id: 'u6', name: 'Peter H.', email: '', verified: true, created_at: '' },
  },
]

export interface MockProvider {
  id: string; name: string; initials: string; rating: number; jobs: number;
  price: number; time: string; message: string; verified: boolean;
  city: string; bio: string; skills: string[]; hourly_rate: number;
  member_since: string; response_rate: number; completed_on_time: number;
  portfolio: Array<{ emoji: string; title: string; price: string; date: string }>
}

export const MOCK_PROVIDERS: Record<string, MockProvider> = {
  pr1: {
    id: 'pr1', name: 'Олексій Марченко', initials: 'ОМ', rating: 4.9, jobs: 38,
    price: 420, time: '2 дні', message: 'Маю 10 років досвіду. Роблю всі види електромонтажних робіт з гарантією.',
    verified: true, city: 'Bratislava', hourly_rate: 35,
    bio: 'Електрик з 10-річним досвідом. Спеціалізуюсь на жилих та комерційних об\'єктах. Всі роботи виконую згідно норм безпеки, з гарантією 2 роки.',
    skills: ['Електромонтаж', 'Проводка', 'Щитки', 'Діагностика', 'Панельні будинки'],
    member_since: '2023-03', response_rate: 97, completed_on_time: 95,
    portfolio: [
      { emoji: '⚡', title: 'Проводка 3-кімн. квартири', price: '€580', date: 'Червень 2026' },
      { emoji: '🔌', title: 'Щиток з автоматами', price: '€220', date: 'Травень 2026' },
      { emoji: '💡', title: 'Освітлення офісу 80м²', price: '€340', date: 'Квітень 2026' },
    ],
  },
  pr2: {
    id: 'pr2', name: 'МайстерЕлект', initials: 'МЕ', rating: 4.7, jobs: 21,
    price: 380, time: '3 дні', message: 'Акуратна робота, приберу після себе.',
    verified: false, city: 'Bratislava', hourly_rate: 28,
    bio: 'Невеликий сімейний бізнес. Акуратно, чисто, без зайвих слів. Працюю переважно в Petržalka та центрі.',
    skills: ['Електрика', 'Освітлення', 'Розетки', 'Вимикачі'],
    member_since: '2024-01', response_rate: 89, completed_on_time: 90,
    portfolio: [
      { emoji: '💡', title: 'Освітлення вітальні', price: '€180', date: 'Травень 2026' },
      { emoji: '🔌', title: 'Розетки на кухні', price: '€95', date: 'Квітень 2026' },
    ],
  },
  pr3: {
    id: 'pr3', name: 'Василь Ковальчук', initials: 'ВК', rating: 5.0, jobs: 55,
    price: 500, time: '1 день', message: 'Спеціалізуюсь на панельних будинках.',
    verified: true, city: 'Bratislava', hourly_rate: 45,
    bio: 'Майстер вищого класу. 15 років виключно електричних робіт. Маю всі ліцензії та сертифікати. Панельні будинки — моя спеціалізація.',
    skills: ['Електромонтаж', 'Панельні будинки', 'Ліцензований', 'Автоматика', 'Смарт-дім'],
    member_since: '2022-06', response_rate: 100, completed_on_time: 98,
    portfolio: [
      { emoji: '🏠', title: 'Повна реновація електрики', price: '€1,200', date: 'Червень 2026' },
      { emoji: '⚡', title: 'Смарт-дім система', price: '€850', date: 'Травень 2026' },
      { emoji: '🔌', title: 'Заземлення будинку', price: '€380', date: 'Березень 2026' },
    ],
  },
  pr4: {
    id: 'pr4', name: 'Тайл Студіо', initials: 'ТС', rating: 4.9, jobs: 67,
    price: 950, time: '3 дні', message: 'Досвід у таких ремонтах, можу завтра. Гарантія 2 роки.',
    verified: true, city: 'Bratislava', hourly_rate: 40,
    bio: 'Студія плиткових робіт з 8-річним досвідом. Ванні, кухні, підлоги. Працюємо бригадою 2 особи для швидкого результату. Гарантія на всі роботи.',
    skills: ['Плитка', 'Ванні кімнати', 'Кухні', 'Підлоги', 'Затирка', 'Теплі підлоги'],
    member_since: '2022-11', response_rate: 98, completed_on_time: 96,
    portfolio: [
      { emoji: '🛁', title: 'Ванна 7м² під ключ', price: '€1,100', date: 'Червень 2026' },
      { emoji: '🪟', title: 'Плитка на кухні', price: '€680', date: 'Квітень 2026' },
      { emoji: '🏗️', title: 'Підлога в коридорі', price: '€420', date: 'Березень 2026' },
    ],
  },
  pr5: {
    id: 'pr5', name: 'Ян Новак', initials: 'ЯН', rating: 4.7, jobs: 28,
    price: 850, time: '4 дні', message: 'Гарантія 2 роки, акуратна робота.',
    verified: true, city: 'Bratislava', hourly_rate: 32,
    bio: 'Плиточник з досвідом 6 років. Роблю якісно і охайно. Разом з клієнтом підбираємо плитку та розкладку.',
    skills: ['Плитка', 'Мозаїка', 'Ванні', 'Затирка'],
    member_since: '2023-08', response_rate: 92, completed_on_time: 88,
    portfolio: [
      { emoji: '🛁', title: 'Ванна з мозаїкою', price: '€900', date: 'Травень 2026' },
      { emoji: '🚿', title: 'Душова кабіна', price: '€560', date: 'Квітень 2026' },
    ],
  },
  pr9: {
    id: 'pr9', name: 'БудМат Братислава', initials: 'ББ', rating: 4.8, jobs: 90,
    price: 440, time: '1 день', message: 'Є щебінь фракція 20-40. Доставка завтра ранком.',
    verified: true, city: 'Bratislava', hourly_rate: 0,
    bio: 'Постачальник будівельних матеріалів з власним складом в Bratislava. Щебінь, пісок, цемент, цегла. Доставка власним транспортом.',
    skills: ['Щебінь', 'Пісок', 'Цемент', 'Цегла', 'Доставка', 'Оптові ціни'],
    member_since: '2021-05', response_rate: 99, completed_on_time: 97,
    portfolio: [
      { emoji: '🪨', title: 'Щебінь 50т — будмайданчик', price: '€1,100', date: 'Червень 2026' },
      { emoji: '🏗️', title: 'Матеріали для фундаменту', price: '€2,400', date: 'Травень 2026' },
      { emoji: '🧱', title: 'Цегла 10,000 шт.', price: '€3,200', date: 'Квітень 2026' },
    ],
  },
  pr10: {
    id: 'pr10', name: 'Матеріали SK', initials: 'МС', rating: 4.5, jobs: 42,
    price: 460, time: '2 дні', message: 'Доставляємо в Petržalka.',
    verified: false, city: 'Bratislava', hourly_rate: 0,
    bio: 'Будматеріали за доступними цінами. Пісок, щебінь, гравій. Доставка по Bratislava та околицях.',
    skills: ['Пісок', 'Щебінь', 'Гравій', 'Доставка'],
    member_since: '2023-02', response_rate: 88, completed_on_time: 85,
    portfolio: [
      { emoji: '🪨', title: 'Щебінь 20т — приватний дім', price: '€440', date: 'Червень 2026' },
      { emoji: '🏖️', title: 'Пісок для дитячого майданчика', price: '€180', date: 'Травень 2026' },
    ],
  },
}

export const MOCK_PROPOSALS: Record<string, Array<{
  id: string; name: string; initials: string; rating: number; jobs: number;
  price: number; time: string; message: string; verified: boolean;
}>> = {
  e1: [
    { id: 'pr1', name: 'Олексій Марченко', initials: 'ОМ', rating: 4.9, jobs: 38, price: 420, time: '2 дні', message: 'Маю 10 років досвіду. Роблю всі види електромонтажних робіт з гарантією.', verified: true },
    { id: 'pr2', name: 'МайстерЕлект', initials: 'МЕ', rating: 4.7, jobs: 21, price: 380, time: '3 дні', message: 'Акуратна робота, приберу після себе. Можу завтра подивитись.', verified: false },
    { id: 'pr3', name: 'Василь Ковальчук', initials: 'ВК', rating: 5.0, jobs: 55, price: 500, time: '1 день', message: 'Спеціалізуюсь на панельних будинках. Зроблю швидко і якісно.', verified: true },
  ],
  e2: [
    { id: 'pr4', name: 'Тайл Студіо', initials: 'ТС', rating: 4.9, jobs: 67, price: 950, time: '3 дні', message: 'Досвід у таких ремонтах, можу завтра. Гарантія 2 роки.', verified: true },
    { id: 'pr5', name: 'Ян Новак', initials: 'ЯН', rating: 4.7, jobs: 28, price: 850, time: '4 дні', message: 'Гарантія 2 роки, акуратна робота, плитку вибираємо разом.', verified: true },
    { id: 'pr6', name: 'БудьМайстер', initials: 'БМ', rating: 4.9, jobs: 44, price: 1200, time: '2 дні', message: 'Бригада 2 особи, закінчимо швидко. Роботи вихідного дня.', verified: false },
    { id: 'pr7', name: 'Петро Сидоренко', initials: 'ПС', rating: 4.6, jobs: 19, price: 780, time: '5 днів', message: 'Можу почати цього тижня. Покажу фото попередніх робіт.', verified: false },
    { id: 'pr8', name: 'ПлиткаPro', initials: 'ПП', rating: 4.8, jobs: 33, price: 1050, time: '3 дні', message: 'Спеціалізуємось виключно на ванних. Великий досвід.', verified: true },
  ],
  e3: [
    { id: 'pr9',  name: 'БудМат Братислава', initials: 'ББ', rating: 4.8, jobs: 90, price: 440, time: '1 день', message: 'Є щебінь фракція 20-40. Доставка завтра ранком.', verified: true },
    { id: 'pr10', name: 'Матеріали SK',      initials: 'МС', rating: 4.5, jobs: 42, price: 460, time: '2 дні', message: 'Доставляємо в Petržalka. Розрахунок готівкою або картою.', verified: false },
  ],
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    user_id: 'u1',
    title: 'Ремонт квартири на Ružinovská',
    desc: 'Повний ремонт 3-кімнатної квартири',
    category: 'renovation',
    tasks: [
      { id: 't1', project_id: 'p1', title: 'Демонтаж старого покриття', done: true, order: 1, created_at: '' },
      { id: 't2', project_id: 'p1', title: 'Штукатурка стін', done: true, order: 2, created_at: '' },
      { id: 't3', project_id: 'p1', title: 'Електрика', done: false, order: 3, created_at: '' },
      { id: 't4', project_id: 'p1', title: 'Укладання плитки у ванній', done: false, order: 4, created_at: '' },
      { id: 't5', project_id: 'p1', title: 'Фарбування стін', done: false, order: 5, created_at: '' },
    ],
    created_at: '2026-06-15T00:00:00Z',
  },
]

export interface MockMessage {
  id: string; from: 'me' | 'them'; text: string; time: string;
}
export interface MockConversation {
  id: string; providerId: string; name: string; initials: string;
  lastMsg: string; lastTime: string; unread: number;
  messages: MockMessage[];
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'c1', providerId: 'pr1', name: 'Олексій Марченко', initials: 'ОМ',
    lastMsg: 'Можу приїхати в четвер, о 10:00', lastTime: '10:42', unread: 2,
    messages: [
      { id: 'm1', from: 'me',   text: 'Привіт! Бачив вашу пропозицію по електриці. Коли зможете приїхати подивитись?', time: '10:30' },
      { id: 'm2', from: 'them', text: 'Добрий день! Так, звісно. Розкажіть більше про об\'єкт — скільки кімнат, який рік будівлі?', time: '10:35' },
      { id: 'm3', from: 'me',   text: '3 кімнати, панельний будинок 1980-х. Потрібно замінити всю проводку.', time: '10:38' },
      { id: 'm4', from: 'them', text: 'Зрозуміло. Це приблизно 2 дні роботи. Можу приїхати в четвер, о 10:00', time: '10:42' },
    ],
  },
  {
    id: 'c2', providerId: 'pr4', name: 'Тайл Студіо', initials: 'ТС',
    lastMsg: 'Надсилаю кошторис зараз', lastTime: 'Вчора', unread: 0,
    messages: [
      { id: 'm5', from: 'me',   text: 'Здрастуйте! Нас цікавить укладка плитки у ванній 6м².', time: '14:00' },
      { id: 'm6', from: 'them', text: 'Вітаємо! Гарний проєкт. Яка плитка — велика формат чи стандарт?', time: '14:10' },
      { id: 'm7', from: 'me',   text: 'Ще не вирішили, можете порадити?', time: '14:12' },
      { id: 'm8', from: 'them', text: 'Рекомендуємо 60×60 для підлоги і 30×60 для стін — виглядає сучасно. Надсилаю кошторис зараз', time: '14:20' },
    ],
  },
  {
    id: 'c3', providerId: 'pr9', name: 'БудМат Братислава', initials: 'ББ',
    lastMsg: 'Доставка завтра о 9:00 ✓', lastTime: 'Пн', unread: 0,
    messages: [
      { id: 'm9',  from: 'me',   text: 'Добрий день. Є щебінь фракція 20-40, 20 тонн?', time: '09:00' },
      { id: 'm10', from: 'them', text: 'Є в наявності! Ціна €440 з доставкою по Bratislava.', time: '09:05' },
      { id: 'm11', from: 'me',   text: 'Чудово, беремо. Коли доставка?', time: '09:07' },
      { id: 'm12', from: 'them', text: 'Доставка завтра о 9:00 ✓', time: '09:10' },
    ],
  },
]
