// Loads the sample catalogue. Safe to re-run: rows are matched on their slug.
// Photography is from Unsplash; the photographer is noted beside each id.
import { sql } from "drizzle-orm";

import { unsplash } from "../data/catalog";
import { db } from "./index";
import { categories, products } from "./schema";

const square = (id: string) => unsplash(id, { width: 1200, height: 1200 });

// A tighter square crop of the same photograph, used as the close-up view.
const closeUp = (id: string, [x, y]: [number, number] = [0.5, 0.5]) =>
  `${unsplash(id, { width: 1200, height: 1200 })}&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=1.9`;

type CategorySeed = {
  slug: string;
  name: string;
  // Only the categories shown as homepage tiles have a photograph.
  photo?: string;
  alt?: string;
};

// Homepage tiles appear in this order.
const categorySeeds: CategorySeed[] = [
  {
    slug: "bags",
    name: "Bags",
    // Genesis Warner
    photo: "1606522754091-a3bbf9ad4cb3",
    alt: "Cream top-handle bag with a turn-lock clasp",
  },
  {
    slug: "shoes",
    name: "Shoes",
    // Drakery 3D
    photo: "1646215279503-7dd99848a8ee",
    alt: "Tan lace-up ankle boot",
  },
  {
    slug: "eyewear",
    name: "Eyewear",
    // charlesdeluvio
    photo: "1511499767150-a48a237f0083",
    alt: "Round gold-rimmed sunglasses with green lenses",
  },
  {
    slug: "knitwear",
    name: "Knitwear",
    // rocknwool
    photo: "1560060141-7b9018741ced",
    alt: "Three folded jumpers stacked on a white chair",
  },
  { slug: "outerwear", name: "Outerwear" },
  { slug: "watches", name: "Watches" },
  { slug: "fragrance", name: "Fragrance" },
  { slug: "small-leather", name: "Small leather goods" },
];

type ProductSeed = {
  slug: string;
  name: string;
  price: number; // whole US dollars
  category: string; // category slug
  photo: string;
  alt: string;
  closeUpFocus?: [number, number];
  badge?: string;
  styleNumber: string;
  stock: number;
  madeToOrder?: boolean;
  description: string;
  details: string[];
  materials: string;
};

const productSeeds: ProductSeed[] = [
  {
    slug: "saddle-stitched-satchel",
    name: "Saddle-stitched satchel",
    price: 1950,
    category: "bags",
    // personalgraphic.co
    photo: "1691480150204-66dd1eb77391",
    alt: "Tan leather satchel with two buckled straps",
    badge: "New",
    styleNumber: "AT-1042",
    stock: 12,
    description:
      "A structured satchel cut from a single vegetable-tanned hide and stitched by hand with waxed linen thread. The two straps fasten on solid brass buckles, and the leather darkens with use.",
    details: [
      "Two rolled top handles and a detachable shoulder strap",
      "Two buckled straps over a zip closure",
      "One zipped and two open pockets inside",
      "36 cm wide, 26 cm high, 14 cm deep",
    ],
    materials:
      "Vegetable-tanned calf leather, cotton twill lining, brass hardware. Wipe with a dry cloth and keep away from rain for the first few weeks.",
  },
  {
    slug: "herringbone-wool-coat",
    name: "Herringbone wool coat",
    price: 2400,
    category: "outerwear",
    // Lisa Anna
    photo: "1722858958066-97deb3471c89",
    alt: "Grey herringbone coat on a hanger",
    badge: "Made to order",
    styleNumber: "AT-2210",
    stock: 0,
    madeToOrder: true,
    description:
      "A single-breasted coat in a heavy black and ecru herringbone, cut long with a soft shoulder. Each one is made after you order it, to your measurements.",
    details: [
      "Notched lapel and three-button front",
      "Two flap pockets and one inside pocket",
      "Half-lined in black satin",
      "Falls below the knee",
    ],
    materials:
      "Pure new wool with a viscose satin lining. Dry clean only, and brush after wearing.",
  },
  {
    slug: "aviator-sunglasses",
    name: "Aviator sunglasses",
    price: 420,
    category: "eyewear",
    // Fashion Needles
    photo: "1752127898590-49bdb53dc704",
    alt: "Black aviator sunglasses with graduated lenses",
    styleNumber: "AT-3105",
    stock: 2,
    description:
      "A double-bridge aviator in polished black acetate with graduated grey lenses. The frame is cut from one sheet and polished by hand for three days.",
    details: [
      "Graduated lenses with full UV protection",
      "Five-barrel hinges",
      "Lens width 58 mm, bridge 14 mm",
      "Supplied with a leather case and a cloth",
    ],
    materials:
      "Cellulose acetate frame and nylon lenses. Rinse in lukewarm water and dry with the cloth supplied.",
  },
  {
    slug: "slim-leather-strap-watch",
    name: "Slim leather-strap watch",
    price: 1280,
    category: "watches",
    // Faraz Fayaz
    photo: "1758887952896-8491d393afe2",
    alt: "Black watch with a plain dial and a leather strap",
    closeUpFocus: [0.55, 0.5],
    styleNumber: "AT-4007",
    stock: 6,
    description:
      "A 38 mm watch with a matte black dial, no numerals and a case only 7 mm deep. It sits flat under a shirt cuff.",
    details: [
      "Blackened steel case, 38 mm across",
      "Sapphire crystal",
      "Quartz movement with a five-year battery",
      "Water resistant to 30 metres",
    ],
    materials:
      "Stainless steel case and calf leather strap. Keep the strap dry, and have the seals checked every three years.",
  },
  {
    slug: "lace-stitch-cardigan",
    name: "Lace-stitch cardigan",
    price: 640,
    category: "knitwear",
    // rocknwool
    photo: "1536992266094-82847e1fd431",
    alt: "Teal hand-knitted cardigan with a lace-stitch panel",
    badge: "New",
    styleNumber: "AT-5031",
    stock: 9,
    description:
      "A relaxed cardigan knitted by hand in a soft teal yarn, with a leaf-pattern lace panel running down each front. The sleeves are meant to be turned back.",
    details: [
      "Open front with no fastening",
      "Lace-stitch panels on both fronts",
      "Ribbed hem and cuffs",
      "Relaxed fit, true to size",
    ],
    materials:
      "Merino wool and cotton. Wash by hand in cool water and dry flat.",
  },
  {
    slug: "eau-de-parfum-50ml",
    name: "Eau de parfum, 50 ml",
    price: 190,
    category: "fragrance",
    // Benjamin Watterson
    photo: "1693960794377-b388be4227c2",
    alt: "Black glass perfume bottle on a white tray",
    closeUpFocus: [0.5, 0.42],
    styleNumber: "AT-6001",
    stock: 40,
    description:
      "The house scent: cedar and black pepper over a base of worn leather, in a smoked glass bottle. It is the smell of the cutting room in winter.",
    details: [
      "Opens with black pepper and bergamot",
      "Cedar and iris at the heart",
      "Dries down to leather and vetiver",
      "50 ml refillable bottle",
    ],
    materials: "Alcohol denat., parfum, aqua. Keep out of direct sunlight.",
  },
  {
    slug: "round-wire-sunglasses",
    name: "Round wire sunglasses",
    price: 380,
    category: "eyewear",
    // Alondra Lucia
    photo: "1649119161997-00ffc8c24e11",
    alt: "Round wire-framed sunglasses with brown lenses",
    closeUpFocus: [0.5, 0.42],
    styleNumber: "AT-3098",
    stock: 0,
    description:
      "A round frame in fine gold-plated wire with graduated brown lenses. It weighs 18 grams.",
    details: [
      "Graduated lenses with full UV protection",
      "Adjustable nose pads",
      "Lens width 50 mm, bridge 21 mm",
      "Supplied with a leather case and a cloth",
    ],
    materials:
      "Gold-plated steel frame and nylon lenses. Rinse in lukewarm water and dry with the cloth supplied.",
  },
  {
    slug: "bifold-wallet",
    name: "Bifold wallet",
    price: 320,
    category: "small-leather",
    // Oliur
    photo: "1612023395494-1c4050b68647",
    alt: "Black leather bifold wallet",
    styleNumber: "AT-7012",
    stock: 15,
    description:
      "A slim bifold in black grained calf, with edges painted and burnished by hand. It holds six cards and folded notes without bulging.",
    details: [
      "Six card slots and one note compartment",
      "Painted and burnished edges",
      "Blind-stamped inside",
      "11 cm wide and 9 cm high when closed",
    ],
    materials: "Grained calf leather with a calf lining. Wipe with a dry cloth.",
  },
];

async function seed() {
  const savedCategories = await db
    .insert(categories)
    .values(
      categorySeeds.map(({ photo, alt, ...category }, index) => ({
        ...category,
        imageUrl: photo ? square(photo) : null,
        imageAlt: alt ?? null,
        sortOrder: index,
      })),
    )
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: sql`excluded.name`,
        imageUrl: sql`excluded.image_url`,
        imageAlt: sql`excluded.image_alt`,
        sortOrder: sql`excluded.sort_order`,
      },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const categoryIds = new Map(
    savedCategories.map((category) => [category.slug, category.id]),
  );

  const savedProducts = await db
    .insert(products)
    .values(
      productSeeds.map(
        ({ price, category, photo, alt, closeUpFocus, ...product }) => {
          const categoryId = categoryIds.get(category);
          if (categoryId === undefined) {
            throw new Error(`Unknown category "${category}" on ${product.slug}`);
          }
          return {
            ...product,
            categoryId,
            priceCents: price * 100,
            images: [
              { src: square(photo), alt },
              { src: closeUp(photo, closeUpFocus), alt: `${alt}, close view` },
            ],
          };
        },
      ),
    )
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        name: sql`excluded.name`,
        categoryId: sql`excluded.category_id`,
        priceCents: sql`excluded.price_cents`,
        stock: sql`excluded.stock`,
        madeToOrder: sql`excluded.made_to_order`,
        badge: sql`excluded.badge`,
        styleNumber: sql`excluded.style_number`,
        description: sql`excluded.description`,
        details: sql`excluded.details`,
        materials: sql`excluded.materials`,
        images: sql`excluded.images`,
      },
    })
    .returning({ id: products.id });

  console.log(
    `Seeded ${savedCategories.length} categories and ${savedProducts.length} products.`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
