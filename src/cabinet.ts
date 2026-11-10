import { assets } from './assets';

export type CabinetMember = {
  id: string;
  name: string;
  designation: string;
  category: 'main' | 'executive';
  image?: string;
  notes?: string;
};

export const cabinetMembers: CabinetMember[] = [
  { id: 'amjad-amin', name: 'Amjad Amin', designation: 'Chairman', category: 'main', image: assets.amjad },
  { id: 'malik-zahid', name: 'Malik Zahid', designation: 'Vice Chairman', category: 'main', image: assets.malik },
  { id: 'sohail-majeed', name: 'Sohail Majeed', designation: 'President', category: 'main', image: assets.sohail },
  { id: 'meer-asmat-baloch', name: 'Meer Asmat Baloch', designation: 'General Secretary', category: 'main', image: assets.meer },
  { id: 'ramish-khan', name: 'Ramish Khan', designation: 'Advisor to Council', category: 'executive', image: assets.ramish },
  { id: 'muhammad-haris', name: 'Muhammad Haris', designation: 'Joint Secretary', category: 'executive', image: assets.haris },
  { id: 'zeeshan-chandia', name: 'Zeeshan Chandia', designation: 'Cultural Secretary', category: 'executive', image: assets.zeeshan },
  { id: 'adnan-zafar', name: 'Adnan Zafar', designation: 'Finance Secretary', category: 'executive', image: assets.adnan },
  { id: 'muhammad-ahmad', name: 'Muhammad Ahmad', designation: 'Information Secretary', category: 'executive', image: assets.ahmed },
  { id: 'asadullah', name: 'Asadullah', designation: 'Academic Secretary', category: 'executive', image: assets.asadullah },
  { id: 'zulfiqar-ahmad', name: 'Zulfiqar Ahmad', designation: 'Action Committee Head', category: 'executive', image: assets.zulfiqar },
  { id: 'malik-sheroz', name: 'Malik Sheroz', designation: 'Senior Event Organizer', category: 'executive', image: assets.sheroz },
  { id: 'hasnain-shafi', name: 'Hasnain Shafi', designation: 'Sports Secretary', category: 'executive', image: assets.husnain },
];
