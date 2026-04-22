'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  TrendingUp,
  Zap,
  BarChart3,
  Menu,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// ==================== Animation Variants ====================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const slideInVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ==================== Navigation ====================
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/40 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="font-bold text-lg sm:text-xl text-slate-900">HabitFlow</span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'How It Works', href: '#how-it-works' },
            ].map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                whileHover={{ color: '#10B981' }}
                className="text-slate-700 hover:text-emerald-600 transition-colors text-sm font-medium"
              >
                {item.label}
              </motion.a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:block text-slate-700 hover:text-emerald-600 font-medium text-sm cursor-pointer"
              >
                Log In
              </motion.span>
            </Link>
            <Link href="/signup">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Get Started
              </motion.span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200/20 bg-white/90"
            >
              <div className="px-4 py-4 space-y-3">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'How It Works', href: '#how-it-works' },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-slate-700 hover:text-emerald-600 font-medium py-2"
                  >
                    {item.label}
                  </a>
                ))}
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <span className="block w-full mt-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-center cursor-pointer">
                    Get Started Free
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// ==================== Hero Section ====================
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-20 right-20 w-72 h-72 bg-emerald-200 rounded-full blur-3xl opacity-30 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
        className="absolute bottom-20 left-20 w-72 h-72 bg-teal-200 rounded-full blur-3xl opacity-20 pointer-events-none"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-5xl mx-auto text-center z-10"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-emerald-700 font-medium">
              Now with AI-powered insights
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight"
        >
          Build Better Habits,{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Transform Your Life
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl text-slate-600 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2"
        >
          Track daily habits, visualize progress with AI insights, and build a better version
          of yourself. Join thousands transforming their lives.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-20 px-2"
        >
          <Link href="/signup">
            <motion.span
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-emerald-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </Link>
          <a href="#how-it-works">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-bold text-base sm:text-lg hover:border-emerald-600 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              How It Works
            </motion.span>
          </a>
        </motion.div>

        {/* Hero Visual */}
        <motion.div variants={scaleInVariants} className="relative rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 rounded-2xl p-4 sm:p-8 flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              </div>
              <p className="text-slate-400 text-sm sm:text-base">Dashboard Preview</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div variants={itemVariants} className="mt-12 sm:mt-16 text-center">
          <p className="text-xs sm:text-sm text-slate-600 mb-3">Trusted by 5,000+ habit builders</p>
          <div className="flex justify-center gap-2 sm:gap-3">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.2 }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white cursor-pointer"
              />
            ))}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs sm:text-sm font-bold text-slate-700">
              +97
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

// ==================== Features Section ====================
const FeaturesSection = () => {
  const features = [
    {
      icon: CheckCircle,
      title: 'Smart Habit Tracking',
      description: 'Track daily habits with intuitive check-ins and automatic streak counting.',
    },
    {
      icon: BarChart3,
      title: 'Visual Analytics',
      description: 'Beautiful charts and heatmaps showing your progress patterns over time.',
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Get personalized AI analysis of your habit patterns and recommendations.',
    },
    {
      icon: Zap,
      title: 'Smart Reminders',
      description: 'Timely notifications to keep you on track with your daily goals.',
    },
  ];

  return (
    <section id="features" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Powerful features designed to help you build lasting habits
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <motion.div
                className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 group-hover:text-white transition-colors" />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ==================== How It Works ====================
const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'Plant Your Seeds',
      description: 'Create habits — good ones to build, bad ones to break. Set your goals and frequency.',
    },
    {
      number: '02',
      title: 'Nurture Daily',
      description: 'Check off completed habits each day. For bad habits, mark your avoidance success.',
    },
    {
      number: '03',
      title: 'Watch It Grow',
      description: 'See your progress through analytics, streaks, and your growing digital forest.',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Three simple steps to transform your daily routine.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-8 sm:space-y-12"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={slideInVariants}
              className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start sm:items-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
              >
                <span className="text-2xl sm:text-3xl font-bold text-white">{step.number}</span>
              </motion.div>
              <div className="flex-grow">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="hidden sm:block text-emerald-400 text-3xl"
                >
                  ↓
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ==================== Pricing Section ====================
const PricingSection = () => {
  const plans = [
    {
      name: 'Seedling',
      price: 'Free',
      description: 'Perfect for getting started',
      features: ['Up to 5 daily habits', 'Basic streak tracking', 'Daily journal', 'Standard themes'],
      cta: 'Get Started Free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Forest Pro',
      price: '₹499',
      period: '/month',
      description: 'For dedicated cultivators',
      features: [
        'Unlimited habits',
        'Advanced analytics',
        'AI-powered insights',
        'Premium themes',
        'Cloud backup',
        'Smart reminders',
      ],
      cta: 'Start Pro — ₹499/mo',
      href: '/signup',
      highlighted: true,
    },
  ];

  return (
    <section id="pricing" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Choose Your Growth Path
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Start free and upgrade when you&apos;re ready to unlock your full potential.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className={`relative p-8 rounded-2xl transition-all ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 shadow-xl'
                  : 'bg-white border border-slate-200 hover:border-emerald-300'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-slate-600 text-sm mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl sm:text-5xl font-bold text-slate-900">{plan.price}</span>
                {plan.period && <span className="text-slate-600 ml-2">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-slate-700"
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <Link href={plan.href}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`block w-full py-3 rounded-xl font-bold transition-colors text-sm sm:text-base text-center cursor-pointer ${
                    plan.highlighted
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </motion.span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ==================== CTA Section ====================
const CTASection = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden"
      >
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"
        />

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to cultivate your best self?
          </h2>
          <p className="text-lg sm:text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
            Join thousands of others who have transformed their routines. Start free today.
          </p>

          <Link href="/signup">
            <motion.span
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 bg-white text-emerald-600 rounded-xl font-bold text-base sm:text-lg hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </Link>

          <p className="text-emerald-100 text-xs sm:text-sm mt-4">No credit card required. Takes 30 seconds.</p>
        </div>
      </motion.div>
    </section>
  );
};

// ==================== Footer ====================
const FooterSection = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              HabitFlow
            </h3>
            <p className="text-sm">Build better habits, transform your life.</p>
          </div>

          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
            { title: 'Company', links: ['About', 'Blog', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-center sm:text-left">
            © 2024 HabitFlow Digital Conservatory. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
              <motion.a
                key={social}
                href="#"
                whileHover={{ y: -2 }}
                className="text-sm hover:text-white transition-colors"
              >
                {social}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// ==================== Main Page ====================
export default function LandingPage() {
  return (
    <div className="bg-white">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
