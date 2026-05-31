export interface Property {
  id: string;
  title: string;
  price: number;
  locality: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  area: number; // sq ft
  type: 'apartment' | 'villa' | 'penthouse' | 'studio' | 'townhouse';
  image: string;
  images?: string[];
  latitude: number;
  longitude: number;
  yearBuilt?: number;
  amenities?: string[];
  description?: string;
  builder?: string;
  status?: 'available' | 'sold' | 'upcoming';
  furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished';
  floor?: number;
  totalFloors?: number;
  parking?: number;
  smartScore?: number;
}
