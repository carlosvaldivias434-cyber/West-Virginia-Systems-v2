export const SHOP_ITEMS = [
  {
    id: 'radio',
    name: 'High-Band Emergency Radio',
    price: 2500,
    sellPrice: 1750,
    category: 'Equipment',
    description: 'Encrypted Motorola APX 8000 handheld radio for emergency communications.'
  },
  {
    id: 'vest',
    name: 'Level IIIA Kevlar Armor Vest',
    price: 5000,
    sellPrice: 3500,
    category: 'Equipment',
    description: 'Protective ballistic vest for patrol operations.'
  },
  {
    id: 'custom_plate',
    name: 'Custom WV Vanity Plate',
    price: 10000,
    sellPrice: 7000,
    category: 'Cosmetic',
    description: 'Personalized West Virginia State registered license plate.'
  },
  {
    id: 'radar',
    name: 'Stalker DSR 2X Dual Radar',
    price: 15000,
    sellPrice: 10500,
    category: 'Equipment',
    description: 'Precision dual-antenna Doppler radar speed tracking system.'
  },
  {
    id: 'crown_vic',
    name: '2008 Ford Crown Victoria P71',
    price: 35000,
    sellPrice: 24500,
    category: 'Vehicles',
    description: 'Classic durable Police Interceptor with pushbar and spotlights.'
  },
  {
    id: 'charger',
    name: '2021 Dodge Charger Pursuit V8',
    price: 65000,
    sellPrice: 45500,
    category: 'Vehicles',
    description: 'High-speed interceptor package equipped for highway enforcement.'
  },
  {
    id: 'heli_pass',
    name: 'WVSP Aviation Flight Pass',
    price: 150000,
    sellPrice: 105000,
    category: 'Certifications',
    description: 'Official State Police air wing pilot authorization for Bell 407 helicopter.'
  },
  {
    id: 'mansion',
    name: 'Charleston Mountain Luxury Estate',
    price: 500000,
    sellPrice: 350000,
    category: 'Real Estate',
    description: 'Private 10-acre estate overlooking the Kanawha River in Charleston.'
  }
];

export function getItem(idOrName) {
  if (!idOrName) return null;
  const target = idOrName.toLowerCase().trim();
  return SHOP_ITEMS.find(i => i.id.toLowerCase() === target || i.name.toLowerCase() === target) || null;
}
