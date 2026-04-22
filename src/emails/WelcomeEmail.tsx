import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  firstName: string;
  dashboardUrl: string;
}

export default function WelcomeEmail({
  firstName = 'there',
  dashboardUrl = 'https://habitflow.app/dashboard',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to HabitFlow - Start building habits that stick</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo/Header */}
          <Section style={header}>
            <Text style={logo}>🌿 HabitFlow</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Welcome to HabitFlow, {firstName}!</Heading>
            
            <Text style={text}>
              We're excited to have you join our community of habit builders. HabitFlow helps you track your daily routines and build lasting positive habits.
            </Text>

            {/* Features */}
            <Section style={featuresSection}>
              <div style={feature}>
                <Text style={featureIcon}>📊</Text>
                <Text style={featureTitle}>Track Your Progress</Text>
                <Text style={featureText}>
                  Visualize your habit completion with beautiful charts and heatmaps
                </Text>
              </div>

              <div style={feature}>
                <Text style={featureIcon}>🔥</Text>
                <Text style={featureTitle}>Build Streaks</Text>
                <Text style={featureText}>
                  Stay motivated by maintaining daily streaks and watching your forest grow
                </Text>
              </div>

              <div style={feature}>
                <Text style={featureIcon}>🔔</Text>
                <Text style={featureTitle}>Smart Reminders</Text>
                <Text style={featureText}>
                  Never miss a habit with timely notifications that keep you on track
                </Text>
              </div>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Go to Dashboard
              </Button>
            </Section>

            {/* Tip */}
            <Section style={tipSection}>
              <Text style={tipLabel}>💡 Pro Tip</Text>
              <Text style={tipText}>
                Start with just 1 habit. Consistency beats quantity. Once you've built a solid routine, you can always add more.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Happy habit building!<br />
              The HabitFlow Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f0fdf4',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#059669',
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '40px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const h1 = {
  color: '#065f46',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  lineHeight: '1.3',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const featuresSection = {
  margin: '32px 0',
};

const feature = {
  marginBottom: '24px',
};

const featureIcon = {
  fontSize: '32px',
  margin: '0 0 8px',
};

const featureTitle = {
  color: '#059669',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 4px',
};

const featureText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const tipSection = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px',
  marginTop: '32px',
};

const tipLabel = {
  color: '#059669',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const tipText = {
  color: '#065f46',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};
