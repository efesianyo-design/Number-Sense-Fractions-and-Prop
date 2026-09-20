export type FormLevel = 'Form 1' | 'Form 2' | 'Form 3';

export interface StudentProfile {
  id: string;
  name: string;
  classOrHouse: string;
  level: FormLevel;
  avatarSeed: string;
  createdAt: string;
}

export type ActivityTopic = 
  | 'Fraction Equivalence'
  | 'Unlike Denominators'
  | 'Fraction Addition'
  | 'Fraction Subtraction'
  | 'Fraction Multiplication'
  | 'Fraction Division'
  | 'Fraction Wall Scanner'
  | 'Number Line Anchors'
  | 'Fraction Comparator'
  | '4-Track Builder'
  | 'Missing Gap'
  | 'Number Line Jumps'
  | 'Decimal Rounding'
  | '100-Grid Percentages'
  | 'Market Discount'
  | 'Recipe Proportions'
  | 'Fair-Share Kitchen'
  | 'SHS 1-Min Challenge';

export interface ActivityLog {
  id: string;
  studentId: string;
  studentName: string;
  studentLevel: FormLevel;
  topic: ActivityTopic;
  title: string;
  details: string;
  latexExpression?: string;
  success: boolean;
  score?: number;
  timeSpentSeconds?: number;
  timestamp: string;
}

export type FractionDenominator = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

export interface FractionStripItem {
  id: string;
  numerator: number;
  denominator: FractionDenominator;
  color: string;
}

export interface ComparisonTrack {
  id: number;
  title: string;
  items: FractionStripItem[];
}

export interface JumpVector {
  id: string;
  from: number;
  to: number;
  delta: number;
  direction: 'right' | 'left';
  color: string;
}

export interface ChallengeCard {
  id: string;
  level: FormLevel;
  title: string;
  prompt: string;
  type: 'pizza' | 'chocolate' | 'discount' | 'ratio' | 'equivalence';
  contextData: any;
  targetFraction: { num: number; den: number };
  targetDecimal?: number;
  timeLimitSeconds: number;
  points: number;
  socraticHintOffline: string[];
}

export interface SocraticMessage {
  id: string;
  sender: 'coach' | 'student';
  text: string;
  latex?: string;
  timestamp: Date;
  isAiGenerated?: boolean;
  isStreaming?: boolean;
}
