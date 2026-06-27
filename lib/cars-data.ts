export interface CarData {
  id: string;
  name: string;
  type: string;
  year: number;
  fuel: string;
  transmission: string;
  seats: number;
  pricePerHr: number;
  kmIncluded: number;
  kmPackagePrice: number;
  securityDeposit: number;
  rating: number;
  reviews: number;
  badge: string;
  badgeColor: string;
  gradient: string;
  image: string;
}

export const CARS: CarData[] = [
  {
    id: "hyundai-i20", name: "Hyundai i20", type: "Hatchback", year: 2023,
    fuel: "Petrol", transmission: "Manual", seats: 5, pricePerHr: 89,
    kmIncluded: 200, kmPackagePrice: 249, securityDeposit: 10000,
    rating: 4.8, reviews: 142, badge: "Most Popular", badgeColor: "#E8540A",
    gradient: "from-[#1C1C2E] to-[#242438]",
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "maruti-swift", name: "Maruti Swift", type: "Hatchback", year: 2023,
    fuel: "Petrol", transmission: "Manual", seats: 5, pricePerHr: 89,
    kmIncluded: 200, kmPackagePrice: 249, securityDeposit: 10000,
    rating: 4.7, reviews: 198, badge: "Best Value", badgeColor: "#10B981",
    gradient: "from-[#1C1C2E] to-[#1A2E1A]",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "hyundai-creta", name: "Hyundai Creta", type: "SUV", year: 2023,
    fuel: "Petrol", transmission: "Automatic", seats: 5, pricePerHr: 139,
    kmIncluded: 250, kmPackagePrice: 299, securityDeposit: 10000,
    rating: 4.9, reviews: 231, badge: "Premium", badgeColor: "#E8540A",
    gradient: "from-[#1C1C2E] to-[#2E1C0F]",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad98?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "kia-seltos", name: "Kia Seltos", type: "SUV", year: 2022,
    fuel: "Diesel", transmission: "Manual", seats: 5, pricePerHr: 129,
    kmIncluded: 250, kmPackagePrice: 299, securityDeposit: 10000,
    rating: 4.8, reviews: 167, badge: "Top Rated", badgeColor: "#F59E0B",
    gradient: "from-[#1C1C2E] to-[#2E2A1C]",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "maruti-ertiga", name: "Maruti Ertiga", type: "MUV", year: 2022,
    fuel: "CNG", transmission: "Manual", seats: 7, pricePerHr: 109,
    kmIncluded: 200, kmPackagePrice: 249, securityDeposit: 10000,
    rating: 4.6, reviews: 88, badge: "Family Pick", badgeColor: "#6366F1",
    gradient: "from-[#1C1C2E] to-[#1C1A2E]",
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "honda-city", name: "Honda City", type: "Sedan", year: 2023,
    fuel: "Petrol", transmission: "Automatic", seats: 5, pricePerHr: 119,
    kmIncluded: 200, kmPackagePrice: 249, securityDeposit: 10000,
    rating: 4.8, reviews: 134, badge: "Executive", badgeColor: "#0EA5E9",
    gradient: "from-[#1C1C2E] to-[#0F1A2E]",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "hyundai-venue", name: "Hyundai Venue", type: "SUV", year: 2023,
    fuel: "Petrol", transmission: "Automatic", seats: 5, pricePerHr: 119,
    kmIncluded: 200, kmPackagePrice: 249, securityDeposit: 10000,
    rating: 4.7, reviews: 112, badge: "Compact SUV", badgeColor: "#EC4899",
    gradient: "from-[#1C1C2E] to-[#2E1C26]",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "maruti-baleno", name: "Maruti Baleno", type: "Hatchback", year: 2023,
    fuel: "Petrol", transmission: "Manual", seats: 5, pricePerHr: 94,
    kmIncluded: 200, kmPackagePrice: 249, securityDeposit: 10000,
    rating: 4.7, reviews: 156, badge: "Smart Choice", badgeColor: "#10B981",
    gradient: "from-[#1C1C2E] to-[#152E1C]",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80",
  },
];

export function getCarById(id: string): CarData | undefined {
  return CARS.find((c) => c.id === id);
}
