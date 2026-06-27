export interface User {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  profilePic?: string;
  role: "user" | "admin";
  isVerified: boolean;
  kycStatus: "not_submitted" | "pending" | "verified" | "rejected";
  totalBookings: number;
  createdAt: string;
}
export interface Car {
  _id: string;
  name: string;
  slug: string;
  registrationNo: string;
  modelYear: number;
  type: "Sedan" | "Hatchback" | "SUV" | "MUV" | "Luxury";
  fuel: "Petrol" | "Diesel" | "CNG" | "Electric";
  transmission: "Manual" | "Automatic";
  seats: number;
  regularPrice: number;
  weekendPrice: number;
  securityDeposit: number;
  kmPackage: string;
  images: string[];
  cityId: { _id: string; name: string };
  isActive: boolean;
}

export interface Booking {
  _id: string;
  bookingId: string;
  userId: User;
  carId: Car;
  startTime: string;
  endTime: string;
  pickupLocation: string;
  doorstepDelivery: boolean;
  bookingFare: number;
  securityDeposit: number;
  discount: number;
  gst: number;
  totalAmount: number;
  tokenAmount: number;
  balanceDue: number;
  paymentMode: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  couponCode?: string;
  billUrl?: string;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
}

export interface City {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}
