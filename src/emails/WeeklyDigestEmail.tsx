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

interface WeeklyDigestEmailProps {
  firstName: string;
  completionRate: number;
  bestStreak: number;
  mostCompletedHabit: string;
  analyticsUrl: string;
}

export default function WeeklyDigestEmail({
  firstName = 'there',
  completionRate = 75,
  bestStreak = 7,
  mostCompletedHabit = 'Morning Run',
  analyticsUrl = 'https://habitflow.app/analytics',
}: WeeklyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your weekly habit summary - ${completionRate}% completion rate!`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>🌿 HabitFlow</Text>
            <Text style={subtitle}>Weekly Digest</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Great week, {firstName}! 📊</Heading>
            
            <Text style={text}>
              Here's how you did this week:
            </Text>

            <Section style={statsGrid}>
              <div style={statCard}>
                <Text style={statValue}>{completionRate}%</Text>
                <Text style={statLabel}>Completion Rate</Text>
              </div>
              <div style={statCard}>
                <Text style={statValue}>{bestStreak}</Text>
                <Text style={statLabel}>Best Streak</Text>
              </div>
              <div style={statCard}>
                <Text style={statValue}>🏆</Text>
                <Text style={statLabel}>Most Completed</Text>
                <Text style={statHabit}>{mostCompletedHabit}</Text>
              </div>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={analyticsUrl}>
                View Full Analytics
              </Button>
            </Section>

            <Text style={encouragement}>
              {completionRate >= 80
                ? "Outstanding work! You're building incredible momentum. 🚀"
                : completionRate >= 60
                ? "Solid progress! Keep pushing forward. 💪"
                : "Every habit completed is a win. Let's make next week even better! 🌱"}
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
  backgroundColor: '#f0fdf4',
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

const subtitle = {
  fontSize: '14px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '8px 0 0',
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
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px',
  margin: '32px 0',
};

const statCard = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center' as const,
};

const statValue = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#059669',
  margin: '0 0 8px',
};

const statLabel = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
};

const statHabit = {
  fontSize: '14px',
  color: '#065f46',
  fontWeight: '500',
  margin: '8px 0 0',
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

const encouragement = {
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
