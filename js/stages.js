// Описания стадий эволюции. Стоимость — энергия для перехода НА следующую стадию.
const STAGES = [
  {
    name: 'Кварк',
    desc: 'Хаос элементарных частиц',
    advanceCost: 50,
    palette: {
      bg1: '#0a0014', bg2: '#1e0040',
      main: '#ff33ee', accent: '#33eeff', extra: '#ffee44',
      glow: '#ff66ff',
    },
    audio: { fundamental: 55, harmonics: [1.0, 1.5, 2.5] },
  },
  {
    name: 'Атом',
    desc: 'Электроны вокруг ядра',
    advanceCost: 600,
    palette: {
      bg1: '#000820', bg2: '#001a48',
      main: '#3388ff', accent: '#66ddff', extra: '#ffffff',
      glow: '#aaccff',
    },
    audio: { fundamental: 65, harmonics: [1.0, 2.0, 3.0] },
  },
  {
    name: 'Молекула',
    desc: 'Связи между атомами',
    advanceCost: 7000,
    palette: {
      bg1: '#001a14', bg2: '#003428',
      main: '#22ffaa', accent: '#00ddcc', extra: '#aaffee',
      glow: '#66ffcc',
    },
    audio: { fundamental: 73, harmonics: [1.0, 1.25, 2.0] },
  },
  {
    name: 'Клетка',
    desc: 'Первая жизнь',
    advanceCost: 80000,
    palette: {
      bg1: '#1a0010', bg2: '#3a0020',
      main: '#ff4488', accent: '#ff9966', extra: '#ffaacc',
      glow: '#ff77aa',
    },
    audio: { fundamental: 87, harmonics: [1.0, 1.33, 1.66] },
  },
  {
    name: 'Существо',
    desc: 'Сложный организм',
    advanceCost: 1000000,
    palette: {
      bg1: '#0a1800', bg2: '#1a3400',
      main: '#aaff44', accent: '#ffdd22', extra: '#ddff88',
      glow: '#ccff66',
    },
    audio: { fundamental: 98, harmonics: [1.0, 1.5, 2.25] },
  },
  {
    name: 'Планета',
    desc: 'Мир с лунами',
    advanceCost: 12000000,
    palette: {
      bg1: '#000810', bg2: '#00182c',
      main: '#3399ff', accent: '#ffffff', extra: '#88ccff',
      glow: '#aaddff',
    },
    audio: { fundamental: 110, harmonics: [1.0, 2.0, 3.5] },
  },
  {
    name: 'Звезда',
    desc: 'Термоядерный пульсар',
    advanceCost: 150000000,
    palette: {
      bg1: '#180600', bg2: '#2e1000',
      main: '#ffaa00', accent: '#ffff66', extra: '#ff5511',
      glow: '#ffcc44',
    },
    audio: { fundamental: 130, harmonics: [1.0, 1.5, 2.5, 4.0] },
  },
  {
    name: 'Галактика',
    desc: 'Миллиарды звёзд',
    advanceCost: 2000000000,
    palette: {
      bg1: '#08001a', bg2: '#1a0036',
      main: '#cc88ff', accent: '#ffddff', extra: '#66aaff',
      glow: '#bb99ff',
    },
    audio: { fundamental: 146, harmonics: [1.0, 1.25, 1.5, 2.0] },
  },
  {
    name: 'Вселенная',
    desc: 'Космическая паутина',
    advanceCost: 25000000000,
    palette: {
      bg1: '#000005', bg2: '#0a0a20',
      main: '#ffcc44', accent: '#ffffff', extra: '#aa88ff',
      glow: '#ffddaa',
    },
    audio: { fundamental: 165, harmonics: [1.0, 1.5, 2.0, 3.0, 4.0] },
  },
  {
    name: 'Мультивселенная',
    desc: 'Параллельные пузыри',
    advanceCost: Infinity,
    palette: {
      bg1: '#000000', bg2: '#0e0028',
      main: '#ffffff', accent: '#ff44ff', extra: '#44ffff',
      glow: '#ffffff',
    },
    audio: { fundamental: 196, harmonics: [1.0, 1.333, 1.5, 1.666, 2.0] },
  },
];
