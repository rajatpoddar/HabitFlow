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

interface StreakRiskEmailProps {
  firstName: string;
  currentStreak: number;
  incompleteHabits: Array<{ name: string; icon: string }>;
  dashboardUrl: string;
}

export default function StreakRiskEmail({
  firstName = 'there',
  currentStreak = 7,
  incompleteHabits = [],
  dashboardUrl = 'https://habitflow.app/dashboard',
}: StreakRiskEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Don't break your ${currentStreak}-day streak! Complete your habits today.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>🌿 HabitFlow</Text>
          </Section>

          <Section style={content}>
            <div style={streakBadge}>
              <Text style={streakIcon}>🔥</Text>
              <Text style={streakNumber}>{currentStreak}</Text>
              <Text style={streakLabel}>Day Streak</Text>
            </div>

            <Heading style={h1}>Don't break your streak, {firstName}!</Heading>
            
            <Text style={text}>
              You've built an amazing {currentStreak}-day streak, but you haven't completed all your habits today yet. Let's keep the momentum going!
            </Text>

            {incompleteHabits.length > 0 && (
              <Section style={habitsSection}>
                <Text style={sectionTitle}>Incomplete habits today:</Text>
                {incompleteHabits.map((habit, index) => (
                  <div key={index} style={habitItem}>
                    <Text style={habitIcon}>{habit.icon}</Text>
                    <Text style={habitName}>{habit.name}</Text>
                  </div>
                ))}
              </Section>
            )}

            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                Complete Now
              </Button>
            </Section>

            <Text style={motivationText}>
              Remember: Consistency is key. Even on tough days, completing your habits keeps your progress alive! 💪
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Keep growing!<br />
              The HabitFlow Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#fef2f2',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

const streakBadge = {
  textAlign: 'center' as const,
  backgroundColor: '#fef2f2',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px',
};

const streakIcon = {
  fontSize: '48px',
  margin: '0',
};

const streakNumber = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '8px 0 0',
};

const streakLabel = {
  fontSize: '14px',
  color: '#991b1b',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '4px 0 0',
};

const h1 = {
  color: '#991b1b',
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

const habitsSection = {
  margin: '24px 0',
  backgroundColor: '#f9fafb',
  borderRadius: '12px',
  padding: '20px',
};

const sectionTitle = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 16px',
};

const habitItem = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #e5e7eb',
};

const habitIcon = {
  fontSize: '24px',
  marginRight: '12px',
  margin: '0',
};

const habitName = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const motivationText = {
  color: '#6b7280',
  fontSize: '14px',
  fontStyle: 'italic',
  textAlign: 'center' as const,
  margin: '24px 0 0',
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
