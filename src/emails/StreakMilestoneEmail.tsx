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

interface StreakMilestoneEmailProps {
  firstName: string;
  milestone: number;
  habitName: string;
  dashboardUrl: string;
}

export default function StreakMilestoneEmail({
  firstName = 'there',
  milestone = 7,
  habitName = 'Morning Run',
  dashboardUrl = 'https://habitflow.app/dashboard',
}: StreakMilestoneEmailProps) {
  const getMilestoneMessage = (days: number) => {
    if (days === 7) return "One week strong! 🎉";
    if (days === 21) return "Three weeks of consistency! 🌟";
    if (days === 30) return "One month milestone! 🏆";
    if (days === 60) return "Two months of dedication! 💎";
    if (days === 100) return "100 days! You're unstoppable! 🚀";
    return `${days} days of excellence!`;
  };

  return (
    <Html>
      <Head />
      <Preview>{`🎉 You've reached a ${milestone}-day streak milestone!`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>🌿 HabitFlow</Text>
          </Section>

          <Section style={content}>
            <div style={celebrationBadge}>
              <Text style={celebrationIcon}>🎉</Text>
              <Text style={milestoneNumber}>{milestone}</Text>
              <Text style={milestoneLabel}>Day Streak!</Text>
            </div>

            <Heading style={h1}>{getMilestoneMessage(milestone)}</Heading>
            
            <Text style={text}>
              Congratulations, {firstName}! You've completed <strong>{habitName}</strong> for {milestone} consecutive days. This is a huge achievement!
            </Text>

            <Section style={quoteSection}>
              <Text style={quoteText}>
                "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
              </Text>
              <Text style={quoteAuthor}>— Aristotle</Text>
            </Section>

            <Text style={text}>
              You've proven that consistency creates transformation. Keep going—your future self will thank you! 💪
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={dashboardUrl}>
                View Your Progress
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Celebrating your success!<br />
              The HabitFlow Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#fef3c7',
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

const celebrationBadge = {
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
  borderRadius: '16px',
  padding: '32px',
  marginBottom: '24px',
};

const celebrationIcon = {
  fontSize: '64px',
  margin: '0',
};

const milestoneNumber = {
  fontSize: '56px',
  fontWeight: 'bold',
  color: '#d97706',
  margin: '8px 0 0',
};

const milestoneLabel = {
  fontSize: '16px',
  color: '#92400e',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '4px 0 0',
};

const h1 = {
  color: '#92400e',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const quoteSection = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #d97706',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '32px 0',
};

const quoteText = {
  color: '#1f2937',
  fontSize: '16px',
  fontStyle: 'italic',
  lineHeight: '1.6',
  margin: '0 0 8px',
};

const quoteAuthor = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'right' as const,
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#d97706',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
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
