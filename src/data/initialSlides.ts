import heroKasavuImg from '@/src/assets/images/hero_kasavu_saree_1791103965122.jpg';
import tissueKasavuImg from '@/src/assets/images/product_tissue_kasavu_1791103981693.jpg';
import kanjeevaramImg from '@/src/assets/images/product_kanjeevaram_silk_1791103996721.jpg';
import festiveCoordImg from '@/src/assets/images/product_festive_coord_1791104009348.jpg';

export interface HeroSlideItem {
  id: string;
  tag: string;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  actionCategory?: string;
}

export const INITIAL_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-1',
    tag: 'Heritage Collection',
    category: 'Traditional Sarees',
    title: 'Traditional Kerala Sarees & Designer Wear',
    subtitle: 'Handcrafted Tissue Kasavu weaves, Kanjeevaram silk & celebratory drape collections.',
    image: heroKasavuImg
  },
  {
    id: 'slide-2',
    tag: 'Modern Silhouettes',
    category: 'Co-ord Sets',
    title: 'Contemporary Co-ord Sets & Fusion Wear',
    subtitle: 'Modern tunic & palazzo sets tailored with handloom zari accents.',
    image: festiveCoordImg
  },
  {
    id: 'slide-3',
    tag: 'Festive Ensembles',
    category: 'Churidar Sets',
    title: 'Traditional Sarees and Bridal Silks',
    subtitle: 'Exquisite handloom sarees & custom handcrafted celebratory attire.',
    image: kanjeevaramImg
  },
  {
    id: 'slide-4',
    tag: 'Pure Kasavu',
    category: 'Traditional Sarees',
    title: 'Handcrafted Kerala Kasavu Traditions',
    subtitle: 'Pure Kasavu golden weaves woven with authentic Kerala heritage.',
    image: tissueKasavuImg
  }
];
