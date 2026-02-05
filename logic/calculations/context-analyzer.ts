/**
 * ROSOIDEAE Context Analyzer
 * Intelligent content classification and sentiment detection
 */

interface ContextSignals {
  sentimentPolarity: number; // -1 to 1
  emotionalIntensity: number; // 0 to 1
  formalityIndex: number; // 0 to 1
  technicalDensity: number; // 0 to 1
  questionDensity: number; // Questions per 100 words
  urgencyScore: number; // 0 to 1
  topicCategories: string[];
}

interface LexicalPatterns {
  positiveMarkers: Set<string>;
  negativeMarkers: Set<string>;
  technicalTerms: Set<string>;
  formalPhrases: Set<string>;
  urgentIndicators: Set<string>;
}

export class ContextAnalyzer {
  private lexicalPatterns: LexicalPatterns;
  private categoryKeywords: Map<string, Set<string>>;
  
  constructor() {
    this.lexicalPatterns = this.initializeLexicalPatterns();
    this.categoryKeywords = this.initializeCategoryKeywords();
  }
  
  private initializeLexicalPatterns(): LexicalPatterns {
    return {
      positiveMarkers: new Set([
        'excellent', 'great', 'wonderful', 'fantastic', 'amazing',
        'brilliant', 'outstanding', 'perfect', 'superb', 'magnificent',
        'delightful', 'impressive', 'remarkable', 'extraordinary'
      ]),
      negativeMarkers: new Set([
        'terrible', 'awful', 'horrible', 'dreadful', 'poor',
        'bad', 'disappointing', 'inadequate', 'inferior', 'deficient',
        'unsatisfactory', 'problematic', 'concerning', 'troubling'
      ]),
      technicalTerms: new Set([
        'algorithm', 'implementation', 'infrastructure', 'architecture',
        'optimization', 'scalability', 'authentication', 'encryption',
        'database', 'framework', 'protocol', 'interface', 'deployment'
      ]),
      formalPhrases: new Set([
        'therefore', 'furthermore', 'consequently', 'nevertheless',
        'moreover', 'accordingly', 'subsequently', 'notwithstanding',
        'whereas', 'hereby', 'pursuant', 'aforementioned'
      ]),
      urgentIndicators: new Set([
        'urgent', 'critical', 'emergency', 'asap', 'immediately',
        'priority', 'deadline', 'time-sensitive', 'crucial', 'vital'
      ])
    };
  }
  
  private initializeCategoryKeywords(): Map<string, Set<string>> {
    const categories = new Map<string, Set<string>>();
    
    categories.set('technical_discussion', new Set([
      'code', 'programming', 'development', 'software', 'system',
      'api', 'database', 'server', 'client', 'architecture'
    ]));
    
    categories.set('community_building', new Set([
      'welcome', 'introduce', 'community', 'member', 'join',
      'participate', 'contribute', 'collaboration', 'together'
    ]));
    
    categories.set('feature_request', new Set([
      'feature', 'suggestion', 'proposal', 'idea', 'enhancement',
      'improvement', 'addition', 'functionality', 'capability'
    ]));
    
    categories.set('bug_report', new Set([
      'bug', 'error', 'issue', 'problem', 'crash', 'fail',
      'broken', 'not working', 'malfunction', 'defect'
    ]));
    
    categories.set('help_support', new Set([
      'help', 'how', 'question', 'confused', 'understand',
      'explain', 'clarify', 'assist', 'guide', 'tutorial'
    ]));
    
    return categories;
  }
  
  analyzeContext(contentText: string): ContextSignals {
    const words = this.tokenizeText(contentText);
    const wordSet = new Set(words.map(w => w.toLowerCase()));
    
    return {
      sentimentPolarity: this.computeSentimentPolarity(wordSet),
      emotionalIntensity: this.measureEmotionalIntensity(contentText, words),
      formalityIndex: this.assessFormality(wordSet, words.length),
      technicalDensity: this.calculateTechnicalDensity(wordSet, words.length),
      questionDensity: this.computeQuestionDensity(contentText, words.length),
      urgencyScore: this.evaluateUrgency(wordSet, contentText),
      topicCategories: this.classifyTopics(wordSet)
    };
  }
  
  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }
  
  private computeSentimentPolarity(wordSet: Set<string>): number {
    let positiveCount = 0;
    let negativeCount = 0;
    
    wordSet.forEach(word => {
      if (this.lexicalPatterns.positiveMarkers.has(word)) {
        positiveCount++;
      }
      if (this.lexicalPatterns.negativeMarkers.has(word)) {
        negativeCount++;
      }
    });
    
    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 0;
    
    // Range from -1 (negative) to +1 (positive)
    return (positiveCount - negativeCount) / totalSentimentWords;
  }
  
  private measureEmotionalIntensity(text: string, words: string[]): number {
    // Count exclamation marks and capitalized words
    const exclamations = (text.match(/!/g) || []).length;
    const capitalizedWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
    const repeatedPunctuation = (text.match(/[!?]{2,}/g) || []).length;
    
    const intensityFactors = [
      exclamations / words.length,
      capitalizedWords / words.length,
      repeatedPunctuation / words.length * 2
    ];
    
    const rawIntensity = intensityFactors.reduce((sum, val) => sum + val, 0);
    
    // Normalize to 0-1 range
    return Math.min(1, rawIntensity * 10);
  }
  
  private assessFormality(wordSet: Set<string>, totalWords: number): number {
    let formalityScore = 0;
    
    // Check for formal phrases
    let formalPhraseCount = 0;
    this.lexicalPatterns.formalPhrases.forEach(phrase => {
      if (wordSet.has(phrase)) {
        formalPhraseCount++;
      }
    });
    
    formalityScore += (formalPhraseCount / totalWords) * 100;
    
    // Longer average word length suggests formality
    const avgWordLength = Array.from(wordSet).reduce((sum, word) => sum + word.length, 0) / wordSet.size;
    formalityScore += (avgWordLength - 4) / 10; // Baseline of 4 chars
    
    // Normalize to 0-1
    return Math.min(1, Math.max(0, formalityScore));
  }
  
  private calculateTechnicalDensity(wordSet: Set<string>, totalWords: number): number {
    let technicalCount = 0;
    
    this.lexicalPatterns.technicalTerms.forEach(term => {
      if (wordSet.has(term)) {
        technicalCount++;
      }
    });
    
    return Math.min(1, (technicalCount / totalWords) * 20);
  }
  
  private computeQuestionDensity(text: string, totalWords: number): number {
    const questionMarks = (text.match(/\?/g) || []).length;
    const questionWords = (text.toLowerCase().match(/\b(how|what|why|when|where|who|which)\b/g) || []).length;
    
    const questionsPerHundredWords = ((questionMarks + questionWords) / totalWords) * 100;
    return questionsPerHundredWords;
  }
  
  private evaluateUrgency(wordSet: Set<string>, text: string): number {
    let urgencyScore = 0;
    
    // Check for urgent keywords
    this.lexicalPatterns.urgentIndicators.forEach(indicator => {
      if (wordSet.has(indicator)) {
        urgencyScore += 0.3;
      }
    });
    
    // Multiple exclamation marks
    const multiExclamations = (text.match(/!{2,}/g) || []).length;
    urgencyScore += multiExclamations * 0.2;
    
    // All caps words
    const allCapsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
    urgencyScore += allCapsWords * 0.15;
    
    return Math.min(1, urgencyScore);
  }
  
  private classifyTopics(wordSet: Set<string>): string[] {
    const matchedCategories: Array<{ category: string; score: number }> = [];
    
    this.categoryKeywords.forEach((keywords, category) => {
      let matchCount = 0;
      keywords.forEach(keyword => {
        if (wordSet.has(keyword)) {
          matchCount++;
        }
      });
      
      if (matchCount > 0) {
        matchedCategories.push({
          category,
          score: matchCount / keywords.size
        });
      }
    });
    
    // Return categories sorted by relevance score
    return matchedCategories
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.category);
  }
  
  generateContextSummary(signals: ContextSignals): string {
    const parts: string[] = [];
    
    // Sentiment
    if (signals.sentimentPolarity > 0.3) {
      parts.push('positive tone');
    } else if (signals.sentimentPolarity < -0.3) {
      parts.push('critical tone');
    } else {
      parts.push('neutral tone');
    }
    
    // Emotional intensity
    if (signals.emotionalIntensity > 0.6) {
      parts.push('high emotional intensity');
    }
    
    // Formality
    if (signals.formalityIndex > 0.6) {
      parts.push('formal language');
    } else if (signals.formalityIndex < 0.3) {
      parts.push('casual language');
    }
    
    // Technical
    if (signals.technicalDensity > 0.4) {
      parts.push('technical discussion');
    }
    
    // Questions
    if (signals.questionDensity > 5) {
      parts.push('inquiry-heavy');
    }
    
    // Urgency
    if (signals.urgencyScore > 0.5) {
      parts.push('urgent');
    }
    
    // Categories
    if (signals.topicCategories.length > 0) {
      parts.push(`topics: ${signals.topicCategories.join(', ')}`);
    }
    
    return parts.join('; ');
  }
}
