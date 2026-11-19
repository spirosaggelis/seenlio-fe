import { shopPlatformLabel } from '@/lib/productSeo';

export type FaqItem = { question: string; answer: string };

export type StoredFaq = { question?: string; answer?: string };

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function buyAnswer(sourcePlatform: string | undefined, productCode: string): FaqItem {
  const shop = shopPlatformLabel(sourcePlatform);
  return {
    question: 'Where can I buy it?',
    answer: `Use the shop button on this page. It sends you to ${shop} through seenlio.com/go/${productCode}. Seenlio is an affiliate and may earn a commission at no extra cost to you. Checkout and stock are on the retailer.`,
  };
}

function specificFaqs(stored: StoredFaq[] | undefined): FaqItem[] {
  if (!stored?.length) return [];
  const items: FaqItem[] = [];
  for (const entry of stored) {
    const question = entry.question?.trim();
    const answer = entry.answer?.trim();
    if (!question || !answer || answer.length < 20) continue;
    items.push({ question, answer });
  }
  return items;
}

/**
 * Visible FAQ plus whether it is specific enough for FAQPage JSON-LD.
 * Rewritten products use their own questions, then the buy answer.
 * Older products keep a short fallback and do not get FAQ schema when
 * the only answers are the shared template.
 */
export function productFaqItems(input: {
  shortName: string;
  editorialIntro: string;
  sourcePlatform?: string;
  productCode: string;
  storedFaq?: StoredFaq[];
}): { items: FaqItem[]; emitJsonLd: boolean } {
  const buy = buyAnswer(input.sourcePlatform, input.productCode);
  const stored = specificFaqs(input.storedFaq);
  if (stored.length > 0) {
    return { items: [...stored, buy], emitJsonLd: true };
  }

  const intro = input.editorialIntro.trim();
  return {
    items: [
      {
        question: `What is the ${input.shortName}?`,
        answer: intro,
      },
      buy,
    ],
    emitJsonLd: intro.length >= 160,
  };
}

export function listicleFaqItems(input: {
  title: string;
  intro?: string;
  howWePicked?: string;
  updatedLabel?: string;
}): FaqItem[] {
  return [
    {
      question: `What is “${input.title}”?`,
      answer:
        input.intro?.trim() ||
        `An editorial Seenlio round-up of products we are seeing in short-form video, not a paid ranking.`,
    },
    {
      question: 'How did Seenlio pick these products?',
      answer:
        input.howWePicked?.trim() ||
        'We start from products already published on Seenlio, score them by trend and listing quality, then write original commentary. Retailers do not pay for placement.',
    },
    {
      question: 'When was this list updated?',
      answer: input.updatedLabel
        ? `This round-up was last updated on ${input.updatedLabel}.`
        : 'We refresh round-ups when the underlying product set or trend scores change.',
    },
    {
      question: 'Are the shop links affiliate links?',
      answer:
        'Yes. If you buy through a Seenlio shop link we may earn a commission, at no extra cost to you. That does not change the order of the list.',
    },
  ];
}

export function aboutFaqItems(): FaqItem[] {
  return [
    {
      question: 'What is Seenlio?',
      answer:
        'Seenlio is an editorial website that finds consumer products going around in short videos and publishes unique pages and round-ups with shop links. We are not a marketplace and we do not hold inventory.',
    },
    {
      question: 'How do you choose products?',
      answer:
        'A pipeline watches Amazon (US, DE, and UK) and AliExpress listings that match viral clips, then a human-reviewed publish step puts them on the site. Each public product page gets Seenlio-written title and intro copy. We do not take payment for inclusion.',
    },
    {
      question: 'Do you earn money from the shop buttons?',
      answer:
        'Yes. Shop buttons are affiliate links. If you buy, the retailer may pay us a commission. The price you pay does not go up because of that.',
    },
    {
      question: 'Can I buy directly on Seenlio?',
      answer:
        'No. Checkout happens on Amazon or AliExpress. Always read that listing for shipping, returns, and stock.',
    },
  ];
}
