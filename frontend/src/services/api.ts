import axios from 'axios';

const getBaseURL = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL()
});

// Interceptor to attach Authorization header automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Resolves relative server image URLs into full URLs for web and Android APK WebView
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return '';
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  // Derive origin from VITE_API_URL if configured, otherwise relative
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    const origin = apiUrl.replace(/\/api\/?$/, '');
    return `${origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }

  return imagePath;
};

export default API;

// API Interfaces
export interface UserProfile {
  id?: number;
  user_id?: number;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  goal: 'lose_weight' | 'maintain' | 'gain_weight' | 'build_muscle';
  daily_calorie_target: number;
  food_preferences?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  profile?: UserProfile;
}

export interface FoodItem {
  id: number;
  food_name: string;
  category: string;
  serving_size: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbohydrates_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  image_url?: string;
  source: string;
  source_id?: string;
}

export interface FoodScanItem {
  food_name: string;
  description?: string;
  visible_ingredients?: string[];
  estimated_cooking_method?: string;
  estimated_weight_grams?: number | null;
  estimated_calories?: number | null;
  confidence?: string;
  uncertainties?: string[];
}

export interface FoodScanResult {
  scan_id?: number;
  image_url: string;
  is_food?: boolean;
  is_recognized?: boolean;
  status?: string;
  food_name?: string | null;
  detected_food_name: string | null;
  confidence_score: number;
  confidence_percentage: number;
  confidence_level?: string;
  confidence_threshold?: number;
  is_low_confidence?: boolean;
  description?: string;
  visible_ingredients?: string[];
  estimated_cooking_method?: string | null;
  estimated_weight_grams?: number | null;
  estimated_calories?: number | null;
  uncertainties?: string[];
  items?: FoodScanItem[];
  notes?: string[] | string;
  nutrition_available?: boolean;
  nutrition_status_message?: string;
  nutrition_source?: string;
  matched_food: FoodItem | null;
  weight_g: number;
  suggested_portion_g?: number;
  portion_estimate_description?: string;
  portion_disclaimer?: string;
  message?: string;
  top3?: Array<{
    class_slug: string;
    food_name: string;
    db_food_id: number;
    confidence: number;
    confidence_percentage: number;
  }>;
  model_info?: any;
  nutrition_per_100g?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  calculated_nutrition?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
}

export interface MealPlanItem {
  id: number;
  meal_plan_id: number;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  food_id?: number;
  food_name: string;
  portion_g: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface MealPlan {
  id: number;
  user_id: number;
  date: string;
  target_calories: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meals: {
    Breakfast: MealPlanItem[];
    Lunch: MealPlanItem[];
    Dinner: MealPlanItem[];
    Snack: MealPlanItem[];
  };
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  last_message?: string;
  created_at: string;
}

export interface DailyIntakeItem {
  id: number;
  food_name: string;
  portion_g: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  logged_at: string;
}
