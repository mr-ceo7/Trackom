import React from 'react';

export interface StatMetric {
  id: string;
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  description: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
}

export type CodeLanguage = 'curl' | 'nodejs' | 'python' | 'php';

export interface CampaignSim {
  campaignName: string;
  audienceCount: number;
  messageContent: string;
  estimatedPrice: number;
  concurrency: number;
}

export interface Service {
  icon: React.ReactNode;
  image?: string;
  title: string;
  description: string;
  color: 'brand-primary' | 'brand-accent' | 'brand-emerald';
  featured?: boolean;
}

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  volume: string;
  features: string[];
  cta: string;
  popular: boolean;
  icon: React.ReactNode;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  initials: string;
  rating: number;
  text: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
}
