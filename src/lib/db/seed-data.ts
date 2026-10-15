// Carte de démonstration, reprise et enrichie depuis la version Express (heritage-etape-7).
// Prix en francs CFA. À adapter depuis l'administration (/admin/carte).
import type { Allergen, Tag } from '@/lib/menu-codes';

interface Translation {
  name: string;
  description: string;
}

export interface SeedDish {
  slug: string;
  price: number;
  image?: string;
  allergens?: Allergen[];
  tags?: Tag[];
  signature?: boolean;
  available?: boolean;
  fr: Translation;
  en: Translation;
}

export interface SeedCategory {
  slug: string;
  fr: Translation;
  en: Translation;
  dishes: SeedDish[];
}

export const seedMenu: SeedCategory[] = [
  {
    slug: 'entrees',
    fr: { name: 'Entrées', description: 'Pour ouvrir l’appétit, à la braise ou en fraîcheur.' },
    en: { name: 'Starters', description: 'To awaken the palate, from the embers or fresh from the market.' },
    dishes: [
      {
        slug: 'soya-de-boeuf-au-yaji',
        price: 6500,
        image: 'plats/soya',
        allergens: ['peanuts'],
        tags: ['spicy', 'local'],
        signature: true,
        fr: {
          name: 'Soya de bœuf au yaji',
          description:
            'Fines lamelles de bœuf grillées à la braise, mélange yaji maison, oignon rouge et piment frais.',
        },
        en: {
          name: 'Beef soya with yaji spice',
          description: 'Thin strips of ember-grilled beef, house yaji spice blend, red onion and fresh chilli.',
        },
      },
      {
        slug: 'accras-de-crevettes',
        price: 7500,
        allergens: ['crustaceans', 'gluten', 'eggs'],
        fr: {
          name: 'Accras de crevettes, coulis mangue-piment',
          description: 'Beignets légers de crevettes, coulis de mangue relevé au piment de Penja.',
        },
        en: {
          name: 'Prawn fritters, mango-chilli coulis',
          description: 'Light prawn fritters with a mango coulis lifted with Penja chilli.',
        },
      },
      {
        slug: 'veloute-de-macabo',
        price: 5500,
        allergens: ['milk', 'gluten'],
        tags: ['vegetarian'],
        fr: {
          name: 'Velouté de macabo, huile de njansang',
          description: 'Macabo onctueux, huile parfumée au njansang torréfié, croûtons dorés.',
        },
        en: {
          name: 'Cocoyam velouté, njansang oil',
          description: 'Silky cocoyam soup, toasted njansang-infused oil, golden croutons.',
        },
      },
      {
        slug: 'avocat-crevettes-de-kribi',
        price: 8000,
        allergens: ['crustaceans'],
        fr: {
          name: 'Avocat & crevettes de Kribi',
          description: 'Avocat du marché, crevettes snackées, agrumes et herbes fraîches.',
        },
        en: {
          name: 'Avocado & Kribi prawns',
          description: 'Market avocado, seared prawns, citrus and fresh herbs.',
        },
      },
    ],
  },
  {
    slug: 'plats',
    fr: { name: 'Plats', description: 'Les grands classiques camerounais, travaillés comme à une grande table.' },
    en: { name: 'Mains', description: 'Great Cameroonian classics, crafted with fine-dining precision.' },
    dishes: [
      {
        slug: 'ndole-aux-crevettes',
        price: 14000,
        image: 'plats/ndole',
        allergens: ['peanuts', 'crustaceans'],
        tags: ['local'],
        signature: true,
        fr: {
          name: 'Ndolé aux crevettes',
          description:
            'Feuilles de ndolé mijotées à la pâte d’arachide, crevettes géantes rôties, plantain mûr caramélisé.',
        },
        en: {
          name: 'Ndolé with prawns',
          description: 'Bitterleaf slow-cooked with peanut paste, roasted king prawns, caramelised ripe plantain.',
        },
      },
      {
        slug: 'bar-braise-miondo',
        price: 15000,
        image: 'plats/bar-braise',
        allergens: ['fish'],
        tags: ['spicy', 'local'],
        signature: true,
        fr: {
          name: 'Bar braisé, miondo & sauce pimentée',
          description: 'Filet de bar braisé au feu de bois, miondo, plantain grillé, sauce tomate pimentée.',
        },
        en: {
          name: 'Ember-grilled sea bass, miondo & chilli sauce',
          description:
            'Wood-fire grilled sea bass fillet, miondo cassava sticks, grilled plantain, spiced tomato sauce.',
        },
      },
      {
        slug: 'poulet-dg-heritage',
        price: 12500,
        image: 'plats/poulet-dg',
        allergens: ['celery'],
        tags: ['local'],
        signature: true,
        fr: {
          name: 'Poulet DG Héritage',
          description: 'Cuisse de poulet fermier rôtie, plantains frits, légumes croquants du marché, jus corsé.',
        },
        en: {
          name: 'Héritage Poulet DG',
          description: 'Roasted farm chicken leg, fried plantain, crisp market vegetables, rich jus.',
        },
      },
      {
        slug: 'poisson-braise-entier',
        price: 24000,
        image: 'plats/poisson-braise',
        allergens: ['fish'],
        tags: ['to-share', 'spicy', 'local'],
        fr: {
          name: 'Poisson braisé entier (pour deux)',
          description: 'Bar entier braisé sur feuille de bananier, épices du marché, miondo et bâton de manioc.',
        },
        en: {
          name: 'Whole ember-grilled fish (for two)',
          description: 'Whole sea bass grilled on banana leaf, market spices, miondo and cassava sticks.',
        },
      },
      {
        slug: 'taro-sauce-jaune',
        price: 11000,
        tags: ['local'],
        available: false,
        fr: {
          name: 'Taro sauce jaune',
          description: 'Taro pilé, sauce jaune à l’huile de palme rouge et au bœuf fumé, condiments de Penja.',
        },
        en: {
          name: 'Taro with yellow sauce',
          description: 'Pounded taro, red palm oil yellow sauce with smoked beef, Penja condiments.',
        },
      },
      {
        slug: 'eru-water-fufu',
        price: 10500,
        allergens: ['fish'],
        tags: ['local'],
        fr: {
          name: 'Eru & water fufu',
          description: 'Feuilles d’eru et de waterleaf, peau de bœuf, poisson fumé, water fufu.',
        },
        en: {
          name: 'Eru & water fufu',
          description: 'Eru and waterleaf greens, beef skin, smoked fish, water fufu.',
        },
      },
      {
        slug: 'burger-heritage',
        price: 9500,
        allergens: ['gluten', 'milk', 'mustard', 'sesame'],
        fr: {
          name: 'Burger Héritage',
          description: 'Bœuf de l’Adamaoua, cheddar affiné, oignons au poivre de Penja, frites de plantain.',
        },
        en: {
          name: 'Héritage burger',
          description: 'Adamawa beef, aged cheddar, Penja pepper onions, plantain fries.',
        },
      },
    ],
  },
  {
    slug: 'desserts',
    fr: { name: 'Desserts', description: 'Le cacao, le café et les fruits du pays.' },
    en: { name: 'Desserts', description: 'Cocoa, coffee and the fruits of the land.' },
    dishes: [
      {
        slug: 'fondant-cacao-du-cameroun',
        price: 5500,
        allergens: ['gluten', 'eggs', 'milk'],
        tags: ['vegetarian'],
        signature: true,
        fr: {
          name: 'Fondant au cacao du Cameroun',
          description: 'Cœur coulant au chocolat noir 70 %, glace vanille, éclats de fèves torréfiées.',
        },
        en: {
          name: 'Cameroonian cocoa fondant',
          description: 'Molten 70% dark chocolate heart, vanilla ice cream, roasted cocoa nibs.',
        },
      },
      {
        slug: 'beignets-souffles-mangue',
        price: 4000,
        allergens: ['gluten', 'eggs', 'milk'],
        tags: ['vegetarian'],
        fr: {
          name: 'Beignets soufflés, coulis de mangue',
          description: 'Beignets tièdes au sucre, coulis de mangue et crème légère.',
        },
        en: {
          name: 'Puff-puff, mango coulis',
          description: 'Warm sugared puff-puff, mango coulis and light whipped cream.',
        },
      },
      {
        slug: 'ananas-roti-penja',
        price: 4500,
        tags: ['vegan'],
        fr: {
          name: 'Ananas rôti au poivre de Penja',
          description: 'Ananas caramélisé, sorbet bissap, zestes de citron vert.',
        },
        en: {
          name: 'Roasted pineapple, Penja pepper',
          description: 'Caramelised pineapple, hibiscus sorbet, lime zest.',
        },
      },
      {
        slug: 'creme-brulee-cafe-ouest',
        price: 4500,
        allergens: ['milk', 'eggs'],
        tags: ['vegetarian'],
        fr: {
          name: 'Crème brûlée au café de l’Ouest',
          description: 'Crème infusée à l’arabica des hauts plateaux, sucre roux caramélisé.',
        },
        en: {
          name: 'Western highlands coffee crème brûlée',
          description: 'Custard infused with highland arabica, caramelised brown sugar.',
        },
      },
    ],
  },
  {
    slug: 'boissons-vins',
    fr: { name: 'Boissons & Vins', description: 'Jus pressés, créations maison et sélection de vins.' },
    en: { name: 'Drinks & Wines', description: 'Fresh juices, house creations and a curated wine list.' },
    dishes: [
      {
        slug: 'bissap-maison',
        price: 2500,
        tags: ['alcohol-free', 'local'],
        signature: true,
        fr: {
          name: 'Bissap maison, gingembre & menthe',
          description: 'Infusion de fleurs d’hibiscus, gingembre frais et menthe, servie bien fraîche.',
        },
        en: {
          name: 'House bissap, ginger & mint',
          description: 'Hibiscus flower infusion with fresh ginger and mint, served ice cold.',
        },
      },
      {
        slug: 'jus-de-gingembre',
        price: 2000,
        tags: ['alcohol-free'],
        fr: { name: 'Jus de gingembre pressé', description: 'Gingembre frais, citron, une touche de miel.' },
        en: { name: 'Fresh ginger juice', description: 'Fresh ginger, lemon and a touch of honey.' },
      },
      {
        slug: 'jus-ananas-frais',
        price: 2000,
        tags: ['alcohol-free'],
        fr: { name: 'Jus d’ananas frais', description: 'Pressé le jour même.' },
        en: { name: 'Fresh pineapple juice', description: 'Pressed the same day.' },
      },
      {
        slug: 'cocktail-heritage',
        price: 6500,
        fr: {
          name: 'Cocktail Héritage',
          description: 'Rhum ambré, bissap, citron vert et sirop de miel.',
        },
        en: {
          name: 'Héritage cocktail',
          description: 'Amber rum, bissap, lime and honey syrup.',
        },
      },
      {
        slug: 'vin-rouge-verre',
        price: 5000,
        allergens: ['sulphites'],
        fr: { name: 'Vin rouge — au verre', description: 'Sélection du sommelier, renouvelée chaque mois.' },
        en: { name: 'Red wine — by the glass', description: 'Sommelier’s selection, changed monthly.' },
      },
      {
        slug: 'champagne-coupe',
        price: 9000,
        allergens: ['sulphites'],
        fr: { name: 'Champagne brut — la coupe', description: 'Pour célébrer les grandes occasions.' },
        en: { name: 'Brut champagne — by the glass', description: 'For life’s great occasions.' },
      },
      {
        slug: 'cafe-de-l-ouest',
        price: 1500,
        tags: ['alcohol-free', 'local'],
        fr: { name: 'Café de l’Ouest', description: 'Arabica des hauts plateaux, torréfaction douce.' },
        en: { name: 'Western highlands coffee', description: 'Highland arabica, gently roasted.' },
      },
    ],
  },
];
