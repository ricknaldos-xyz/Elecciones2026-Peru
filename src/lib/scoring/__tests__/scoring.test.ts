import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateEducationScore,
  calculateTotalExperienceYears,
  calculateExperienceTotal,
  calculateExperienceRelevant,
  calculateLeadership,
  calculateCompetence,
  calculateIntegrity,
  calculateTransparency,
  calculateConfidence,
  calculateWeightedScore,
  calculateVotingPenalty,
  calculateTaxPenalty,
  calculateOmissionPenalty,
  calculateCompanyPenalty,
  calculateEnhancedIntegrity,
  calculatePerformanceScore,
  calculateAllScores,
  calculateEnhancedScores,
  type CandidateData,
  type EducationDetail,
  type Experience,
  type EnhancedIntegrityData,
} from '../index'

// Fix current year for deterministic tests
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 1))
})

afterEach(() => {
  vi.useRealTimers()
})

// ============================================
// Helper factories
// ============================================

function makeCandidate(overrides: Partial<CandidateData> = {}): CandidateData {
  return {
    education: [],
    experience: [],
    penalSentences: [],
    civilSentences: [],
    partyResignations: 0,
    declarationCompleteness: 100,
    declarationConsistency: 100,
    assetsQuality: 100,
    verificationLevel: 100,
    coverageLevel: 100,
    ...overrides,
  }
}

function makeEnhanced(overrides: Partial<EnhancedIntegrityData> = {}): EnhancedIntegrityData {
  return {
    ...makeCandidate(),
    ...overrides,
  }
}

function makeEducation(level: EducationDetail['level']): EducationDetail {
  return { level }
}

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    role: 'Director',
    roleType: 'ejecutivo_publico_alto',
    organization: 'Gobierno',
    startYear: 2020,
    endYear: 2024,
    ...overrides,
  }
}

// ============================================
// calculateEducationScore
// ============================================

describe('calculateEducationScore', () => {
  it('returns zeros for empty array', () => {
    const result = calculateEducationScore([])
    expect(result).toEqual({ level: 0, depth: 0, total: 0 })
  })

  it('scores doctorado at 22 points', () => {
    const result = calculateEducationScore([makeEducation('doctorado')])
    expect(result.level).toBe(22)
    expect(result.total).toBe(22)
  })

  it('scores primaria at 2 points', () => {
    const result = calculateEducationScore([makeEducation('primaria')])
    expect(result.level).toBe(2)
    expect(result.total).toBe(2)
  })

  it('gives depth bonus for multiple degrees >= 10 points', () => {
    const result = calculateEducationScore([
      makeEducation('doctorado'),     // 22 (max)
      makeEducation('maestria'),       // 18 (>=10 → +2)
      makeEducation('universitario_completo'), // 14 (>=10 → +2)
    ])
    expect(result.level).toBe(22)
    expect(result.depth).toBe(4)
    expect(result.total).toBe(26)
  })

  it('caps depth bonus at 8', () => {
    const result = calculateEducationScore([
      makeEducation('doctorado'),
      makeEducation('maestria'),
      makeEducation('titulo_profesional'),
      makeEducation('universitario_completo'),
      makeEducation('tecnico_completo'),
      makeEducation('tecnico_completo'), // 5 additional degrees >= 10
    ])
    expect(result.depth).toBe(8)
  })

  it('caps total at 30', () => {
    const result = calculateEducationScore([
      makeEducation('doctorado'),      // 22
      makeEducation('maestria'),        // +2
      makeEducation('titulo_profesional'), // +2
      makeEducation('universitario_completo'), // +2
      makeEducation('tecnico_completo'), // +2 = 8 depth
    ])
    // 22 + 8 = 30
    expect(result.total).toBe(30)
  })

  it('ignores degrees below 10 for depth bonus', () => {
    const result = calculateEducationScore([
      makeEducation('doctorado'),
      makeEducation('secundaria_completa'), // 6 pts, < 10
    ])
    expect(result.depth).toBe(0)
    expect(result.total).toBe(22)
  })

  it('scores sin_informacion as 0', () => {
    const result = calculateEducationScore([makeEducation('sin_informacion')])
    expect(result).toEqual({ level: 0, depth: 0, total: 0 })
  })
})

// ============================================
// calculateTotalExperienceYears
// ============================================

describe('calculateTotalExperienceYears', () => {
  it('returns zeros for empty experience', () => {
    const result = calculateTotalExperienceYears([])
    expect(result).toEqual({ rawYears: 0, uniqueYears: 0, hasOverlap: false })
  })

  it('calculates years without overlap', () => {
    const result = calculateTotalExperienceYears([
      makeExperience({ startYear: 2010, endYear: 2015 }),
      makeExperience({ startYear: 2016, endYear: 2020 }),
    ])
    expect(result.rawYears).toBe(9) // 5 + 4
    expect(result.uniqueYears).toBe(9)
    expect(result.hasOverlap).toBe(false)
  })

  it('detects and handles overlapping periods', () => {
    const result = calculateTotalExperienceYears([
      makeExperience({ startYear: 2010, endYear: 2018 }),
      makeExperience({ startYear: 2015, endYear: 2020 }),
    ])
    expect(result.rawYears).toBe(13) // 8 + 5
    expect(result.uniqueYears).toBe(10) // 2010-2020
    expect(result.hasOverlap).toBe(true)
  })

  it('handles contained ranges', () => {
    const result = calculateTotalExperienceYears([
      makeExperience({ startYear: 2010, endYear: 2020 }),
      makeExperience({ startYear: 2012, endYear: 2016 }),
    ])
    expect(result.rawYears).toBe(14) // 10 + 4
    expect(result.uniqueYears).toBe(10) // 2010-2020
    expect(result.hasOverlap).toBe(true)
  })

  it('uses current year when endYear is undefined', () => {
    const result = calculateTotalExperienceYears([
      makeExperience({ startYear: 2020, endYear: undefined }),
    ])
    expect(result.uniqueYears).toBe(6) // 2026 - 2020
  })
})

// ============================================
// calculateExperienceTotal
// ============================================

describe('calculateExperienceTotal', () => {
  it('returns 0 for no experience', () => {
    expect(calculateExperienceTotal([])).toBe(0)
  })

  it('returns 6 for 2 years', () => {
    const result = calculateExperienceTotal([
      makeExperience({ startYear: 2024, endYear: 2026 }),
    ])
    expect(result).toBe(6)
  })

  it('returns 25 for 15+ years', () => {
    const result = calculateExperienceTotal([
      makeExperience({ startYear: 2000, endYear: 2020 }),
    ])
    expect(result).toBe(25)
  })

  it('returns 16 for 8-10 years', () => {
    const result = calculateExperienceTotal([
      makeExperience({ startYear: 2017, endYear: 2026 }), // 9 years
    ])
    expect(result).toBe(16)
  })

  it('uses unique years, not raw', () => {
    // Two overlapping 5-year periods = only 6 unique years
    const result = calculateExperienceTotal([
      makeExperience({ startYear: 2018, endYear: 2024 }),
      makeExperience({ startYear: 2020, endYear: 2026 }),
    ])
    // Raw = 12, unique = 8
    expect(result).toBe(16) // 8 years -> 16 points
  })
})

// ============================================
// calculateExperienceRelevant
// ============================================

describe('calculateExperienceRelevant', () => {
  it('scores high for presidente with electivo_alto', () => {
    const result = calculateExperienceRelevant(
      [makeExperience({ roleType: 'electivo_alto', startYear: 2016, endYear: 2026 })],
      'presidente'
    )
    // 10 years * 3.0 = 30 → capped at 25
    expect(result).toBe(25)
  })

  it('scores lower for parlamento_andino with electivo_alto', () => {
    const result = calculateExperienceRelevant(
      [makeExperience({ roleType: 'electivo_alto', startYear: 2020, endYear: 2026 })],
      'parlamento_andino'
    )
    // 6 years * 2.2 = 13.2
    expect(result).toBeCloseTo(13.2)
  })

  it('caps experience per role at 10 years', () => {
    const result = calculateExperienceRelevant(
      [makeExperience({ roleType: 'electivo_alto', startYear: 2000, endYear: 2026 })],
      'presidente'
    )
    // min(26, 10) * 3.0 = 30 → capped at 25
    expect(result).toBe(25)
  })

  it('returns 0 for empty experience', () => {
    expect(calculateExperienceRelevant([], 'presidente')).toBe(0)
  })

  it('uses 0.5 for unknown roleType', () => {
    const result = calculateExperienceRelevant(
      [makeExperience({ roleType: 'unknown_type' as any, startYear: 2022, endYear: 2026 })],
      'presidente'
    )
    // 4 years * 0.5 = 2
    expect(result).toBe(2)
  })
})

// ============================================
// calculateLeadership
// ============================================

describe('calculateLeadership', () => {
  it('returns zeros for no leadership experience', () => {
    const result = calculateLeadership([
      makeExperience({ isLeadership: false }),
    ])
    expect(result).toEqual({ seniority: 0, stability: 0, total: 0 })
  })

  it('returns zeros for empty array', () => {
    expect(calculateLeadership([])).toEqual({ seniority: 0, stability: 0, total: 0 })
  })

  it('gives max seniority 14 for direccion', () => {
    const result = calculateLeadership([
      makeExperience({
        isLeadership: true,
        seniorityLevel: 'direccion',
        startYear: 2024,
        endYear: 2026,
      }),
    ])
    expect(result.seniority).toBe(14)
  })

  it('gives stability 6 for 7+ years', () => {
    const result = calculateLeadership([
      makeExperience({
        isLeadership: true,
        seniorityLevel: 'coordinador',
        startYear: 2018,
        endYear: 2026, // 8 years
      }),
    ])
    expect(result.stability).toBe(6)
  })

  it('gives stability 4 for 4-6 years', () => {
    const result = calculateLeadership([
      makeExperience({
        isLeadership: true,
        seniorityLevel: 'jefatura',
        startYear: 2021,
        endYear: 2026, // 5 years
      }),
    ])
    expect(result.stability).toBe(4)
  })

  it('caps total at 20', () => {
    const result = calculateLeadership([
      makeExperience({
        isLeadership: true,
        seniorityLevel: 'direccion', // 14 seniority
        startYear: 2015,
        endYear: 2026, // 11 years → 6 stability
      }),
    ])
    expect(result.total).toBe(20) // 14 + 6 = 20
  })
})

// ============================================
// calculateCompetence
// ============================================

describe('calculateCompetence', () => {
  it('returns 0 for empty candidate', () => {
    const data = makeCandidate()
    const result = calculateCompetence(data, 'presidente')
    expect(result.total).toBe(0)
  })

  it('caps total at 100', () => {
    const data = makeCandidate({
      education: [
        makeEducation('doctorado'),
        makeEducation('maestria'),
        makeEducation('titulo_profesional'),
        makeEducation('universitario_completo'),
        makeEducation('tecnico_completo'),
      ],
      experience: [
        makeExperience({
          roleType: 'electivo_alto',
          startYear: 2000,
          endYear: 2026,
          isLeadership: true,
          seniorityLevel: 'direccion',
        }),
      ],
    })
    const result = calculateCompetence(data, 'presidente')
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('aggregates all sub-scores', () => {
    const data = makeCandidate({
      education: [makeEducation('maestria')], // 18
      experience: [
        makeExperience({
          startYear: 2016,
          endYear: 2026,
          roleType: 'electivo_alto',
          isLeadership: true,
          seniorityLevel: 'gerencia',
        }),
      ],
    })
    const result = calculateCompetence(data, 'presidente')
    expect(result.education.total).toBe(18)
    expect(result.experienceTotal).toBe(16) // 10 unique years
    expect(result.experienceRelevant).toBe(25) // 10 * 3.0 capped at 25
    expect(result.leadership.seniority).toBe(10)
    expect(result.leadership.stability).toBe(6) // 10 years >= 7
    expect(result.total).toBe(Math.min(18 + 16 + 25 + 16, 100))
  })
})

// ============================================
// calculateIntegrity
// ============================================

describe('calculateIntegrity', () => {
  it('returns 100 for clean candidate', () => {
    const data = makeCandidate()
    const result = calculateIntegrity(data)
    expect(result.total).toBe(100)
    expect(result.penalPenalty).toBe(0)
    expect(result.totalCivilPenalty).toBe(0)
    expect(result.resignationPenalty).toBe(0)
  })

  it('applies -70 for 1 firm penal sentence', () => {
    const data = makeCandidate({
      penalSentences: [{ type: 'penal', description: 'test', isFirm: true }],
    })
    const result = calculateIntegrity(data)
    expect(result.penalPenalty).toBe(70)
    expect(result.total).toBe(30)
  })

  it('applies -85 for 2+ firm penal sentences', () => {
    const data = makeCandidate({
      penalSentences: [
        { type: 'penal', description: 'a', isFirm: true },
        { type: 'penal', description: 'b', isFirm: true },
      ],
    })
    const result = calculateIntegrity(data)
    expect(result.penalPenalty).toBe(85)
    expect(result.total).toBe(15)
  })

  it('applies 35 per pending penal case', () => {
    const data = makeCandidate({
      penalSentences: [
        { type: 'penal', description: 'pending', isFirm: false },
      ],
    })
    const result = calculateIntegrity(data)
    expect(result.penalPenalty).toBe(35)
    expect(result.total).toBe(65)
  })

  it('caps pending penal penalties at 85 total', () => {
    const data = makeCandidate({
      penalSentences: [
        { type: 'penal', description: 'a', isFirm: false },
        { type: 'penal', description: 'b', isFirm: false },
        { type: 'penal', description: 'c', isFirm: false },
      ],
    })
    const result = calculateIntegrity(data)
    expect(result.penalPenalty).toBe(85)
  })

  it('applies civil penalties with diminishing returns', () => {
    const data = makeCandidate({
      civilSentences: [
        { type: 'violence', description: 'a' },
        { type: 'violence', description: 'b' },
      ],
    })
    const result = calculateIntegrity(data)
    // 1st violence = 50, 2nd = 50*0.5 = 25, total = 75 (cap 70)
    expect(result.civilPenalties[0].penalty).toBe(70) // capped
    expect(result.civilPenalties[0].capped).toBe(true)
  })

  it('caps per-type civil penalties', () => {
    const data = makeCandidate({
      civilSentences: [
        { type: 'alimentos', description: 'a' },
        { type: 'alimentos', description: 'b' },
        { type: 'alimentos', description: 'c' },
      ],
    })
    const result = calculateIntegrity(data)
    // 35 + 17.5 + 8.75 = 61.25, capped at 50
    expect(result.civilPenalties[0].penalty).toBe(50)
  })

  it('caps total civil penalty at 85', () => {
    const data = makeCandidate({
      civilSentences: [
        { type: 'violence', description: 'a' },
        { type: 'violence', description: 'b' },
        { type: 'alimentos', description: 'c' },
        { type: 'laboral', description: 'd' },
        { type: 'contractual', description: 'e' },
      ],
    })
    const result = calculateIntegrity(data)
    expect(result.totalCivilPenalty).toBeLessThanOrEqual(85)
    expect(result.civilPenaltiesCapped).toBe(true)
  })

  it('applies resignation penalties', () => {
    const data = makeCandidate({ partyResignations: 2 })
    const result = calculateIntegrity(data)
    expect(result.resignationPenalty).toBe(10)
    expect(result.total).toBe(90)
  })

  it('gives -15 for 4+ resignations', () => {
    const data = makeCandidate({ partyResignations: 5 })
    const result = calculateIntegrity(data)
    expect(result.resignationPenalty).toBe(15)
  })

  it('floors total at 0', () => {
    const data = makeCandidate({
      penalSentences: [
        { type: 'penal', description: 'a', isFirm: true },
        { type: 'penal', description: 'b', isFirm: true },
      ],
      civilSentences: [
        { type: 'violence', description: 'c' },
        { type: 'violence', description: 'd' },
      ],
      partyResignations: 4,
    })
    const result = calculateIntegrity(data)
    expect(result.total).toBe(0)
  })
})

// ============================================
// calculateTransparency
// ============================================

describe('calculateTransparency', () => {
  it('returns 100 for perfect transparency', () => {
    const data = makeCandidate({
      declarationCompleteness: 100,
      declarationConsistency: 100,
      assetsQuality: 100,
    })
    const result = calculateTransparency(data)
    expect(result.total).toBe(100)
  })

  it('returns 50 for half values', () => {
    const data = makeCandidate({
      declarationCompleteness: 50,
      declarationConsistency: 50,
      assetsQuality: 50,
    })
    const result = calculateTransparency(data)
    // 17.5 + 17.5 + 15 = 50 (rounded: 18+18+15=51 or 17+17+15=49)
    expect(result.total).toBeGreaterThanOrEqual(49)
    expect(result.total).toBeLessThanOrEqual(51)
  })

  it('applies ONPE sanction penalty at -15 per sanction', () => {
    const data = makeCandidate({ onpeSanctionCount: 1 })
    const result = calculateTransparency(data)
    expect(result.onpePenalty).toBe(15)
    expect(result.total).toBe(85) // 100 - 15
  })

  it('caps ONPE penalty at 30', () => {
    const data = makeCandidate({ onpeSanctionCount: 5 })
    const result = calculateTransparency(data)
    expect(result.onpePenalty).toBe(30)
    expect(result.total).toBe(70) // 100 - 30
  })

  it('floors total at 0', () => {
    const data = makeCandidate({
      declarationCompleteness: 0,
      declarationConsistency: 0,
      assetsQuality: 0,
      onpeSanctionCount: 2,
    })
    const result = calculateTransparency(data)
    expect(result.total).toBe(0)
  })
})

// ============================================
// calculateConfidence
// ============================================

describe('calculateConfidence', () => {
  it('returns 100 for full verification and coverage', () => {
    const data = makeCandidate({ verificationLevel: 100, coverageLevel: 100 })
    const result = calculateConfidence(data)
    expect(result.total).toBe(100)
  })

  it('returns 50 for half levels', () => {
    const data = makeCandidate({ verificationLevel: 50, coverageLevel: 50 })
    const result = calculateConfidence(data)
    expect(result.total).toBe(50)
  })

  it('returns 0 for zero levels', () => {
    const data = makeCandidate({ verificationLevel: 0, coverageLevel: 0 })
    const result = calculateConfidence(data)
    expect(result.total).toBe(0)
  })
})

// ============================================
// calculateWeightedScore
// ============================================

describe('calculateWeightedScore', () => {
  it('returns 100 when all components are 100 (balanced)', () => {
    const result = calculateWeightedScore(100, 100, 100, { wC: 0.45, wI: 0.45, wT: 0.10 })
    expect(result).toBe(100)
  })

  it('returns 0 when all components are 0', () => {
    const result = calculateWeightedScore(0, 0, 0, { wC: 0.45, wI: 0.45, wT: 0.10 })
    expect(result).toBe(0)
  })

  it('applies weights correctly', () => {
    const result = calculateWeightedScore(100, 0, 0, { wC: 0.60, wI: 0.30, wT: 0.10 })
    expect(result).toBeCloseTo(60)
  })

  it('merit weights favor competence', () => {
    const merit = calculateWeightedScore(100, 50, 50, { wC: 0.60, wI: 0.30, wT: 0.10 })
    const intFirst = calculateWeightedScore(100, 50, 50, { wC: 0.30, wI: 0.60, wT: 0.10 })
    expect(merit).toBeGreaterThan(intFirst)
  })
})

// ============================================
// calculateVotingPenalty
// ============================================

describe('calculateVotingPenalty', () => {
  it('returns zero for no voting data', () => {
    const result = calculateVotingPenalty(makeEnhanced())
    expect(result).toEqual({ penalty: 0, bonus: 0, net: 0 })
  })

  it('caps penalty at 85', () => {
    const result = calculateVotingPenalty(makeEnhanced({ votingIntegrityPenalty: 100 }))
    expect(result.penalty).toBe(85)
  })

  it('caps bonus at 15', () => {
    const result = calculateVotingPenalty(makeEnhanced({ votingIntegrityBonus: 50 }))
    expect(result.bonus).toBe(15)
  })

  it('calculates net correctly', () => {
    const result = calculateVotingPenalty(makeEnhanced({
      votingIntegrityPenalty: 30,
      votingIntegrityBonus: 10,
    }))
    expect(result.net).toBe(-20) // 10 - 30
  })

  it('caps net at -85', () => {
    const result = calculateVotingPenalty(makeEnhanced({
      votingIntegrityPenalty: 200,
      votingIntegrityBonus: 0,
    }))
    expect(result.net).toBe(-85)
  })
})

// ============================================
// calculateTaxPenalty
// ============================================

describe('calculateTaxPenalty', () => {
  it('returns 0 for normal tax status', () => {
    const result = calculateTaxPenalty(makeEnhanced())
    expect(result).toBe(0)
  })

  it('penalizes no_habido with 50', () => {
    const result = calculateTaxPenalty(makeEnhanced({ taxCondition: 'no_habido' }))
    expect(result).toBe(50)
  })

  it('penalizes no_hallado with 20', () => {
    const result = calculateTaxPenalty(makeEnhanced({ taxCondition: 'no_hallado' }))
    expect(result).toBe(20)
  })

  it('penalizes suspendido with 15', () => {
    const result = calculateTaxPenalty(makeEnhanced({ taxStatus: 'suspendido' }))
    expect(result).toBe(15)
  })

  it('adds coactive debt penalty', () => {
    const result = calculateTaxPenalty(makeEnhanced({
      hasCoactiveDebts: true,
      coactiveDebtCount: 2,
    }))
    expect(result).toBe(40) // 20 * 2
  })

  it('caps coactive debt multiplier at 3', () => {
    const result = calculateTaxPenalty(makeEnhanced({
      hasCoactiveDebts: true,
      coactiveDebtCount: 10,
    }))
    expect(result).toBe(60) // 20 * 3
  })

  it('caps total at 85', () => {
    const result = calculateTaxPenalty(makeEnhanced({
      taxCondition: 'no_habido',
      taxStatus: 'suspendido',
      hasCoactiveDebts: true,
      coactiveDebtCount: 3,
    }))
    expect(result).toBe(85) // 50 + 15 + 60 = 125 → capped 85
  })
})

// ============================================
// calculateOmissionPenalty
// ============================================

describe('calculateOmissionPenalty', () => {
  it('returns 0 for no discrepancy', () => {
    expect(calculateOmissionPenalty(makeEnhanced())).toBe(0)
  })

  it('returns 0 for discrepancy with severity none', () => {
    const result = calculateOmissionPenalty(makeEnhanced({
      hasJudicialDiscrepancy: true,
      discrepancySeverity: 'none',
    }))
    expect(result).toBe(0)
  })

  it('returns 60 for critical severity', () => {
    const result = calculateOmissionPenalty(makeEnhanced({
      hasJudicialDiscrepancy: true,
      discrepancySeverity: 'critical',
    }))
    expect(result).toBe(60)
  })

  it('adds 10 per undeclared case', () => {
    const result = calculateOmissionPenalty(makeEnhanced({
      hasJudicialDiscrepancy: true,
      discrepancySeverity: 'minor',
      undeclaredCasesCount: 2,
    }))
    expect(result).toBe(40) // 20 + 2*10
  })

  it('caps total at 85', () => {
    const result = calculateOmissionPenalty(makeEnhanced({
      hasJudicialDiscrepancy: true,
      discrepancySeverity: 'critical',
      undeclaredCasesCount: 10,
    }))
    expect(result).toBe(85) // 60 + 100 → capped
  })
})

// ============================================
// calculateCompanyPenalty
// ============================================

describe('calculateCompanyPenalty', () => {
  it('returns 0 for no company issues', () => {
    expect(calculateCompanyPenalty(makeEnhanced())).toBe(0)
  })

  it('penalizes penal cases at 40 each', () => {
    const result = calculateCompanyPenalty(makeEnhanced({ companyPenalCases: 1 }))
    expect(result).toBe(40)
  })

  it('caps at 60', () => {
    const result = calculateCompanyPenalty(makeEnhanced({
      companyPenalCases: 2,
      companyLaborIssues: 3,
      companyEnvironmentalIssues: 2,
    }))
    expect(result).toBe(60)
  })

  it('ignores consumer complaints <= 5', () => {
    const result = calculateCompanyPenalty(makeEnhanced({ companyConsumerComplaints: 5 }))
    expect(result).toBe(0)
  })

  it('penalizes consumer complaints > 5', () => {
    const result = calculateCompanyPenalty(makeEnhanced({ companyConsumerComplaints: 6 }))
    expect(result).toBe(15)
  })
})

// ============================================
// calculateEnhancedIntegrity
// ============================================

describe('calculateEnhancedIntegrity', () => {
  it('returns 100 for clean enhanced candidate', () => {
    const result = calculateEnhancedIntegrity(makeEnhanced())
    expect(result.total).toBe(100)
    expect(result.breakdown.subtotals.final).toBe(100)
  })

  it('chains subtotals correctly', () => {
    const result = calculateEnhancedIntegrity(makeEnhanced({
      penalSentences: [{ type: 'penal', description: 'a', isFirm: true }], // -70
      votingIntegrityPenalty: 10,
      taxCondition: 'no_hallado', // -20
    }))
    const b = result.breakdown
    expect(b.subtotals.afterTraditional).toBe(30)  // 100 - 70
    expect(b.subtotals.afterVoting).toBe(20)  // 30 - 10
    expect(b.subtotals.afterTax).toBe(0)  // 20 - 20
    expect(b.subtotals.final).toBe(0)
  })

  it('floors at 0', () => {
    const result = calculateEnhancedIntegrity(makeEnhanced({
      penalSentences: [
        { type: 'penal', description: 'a', isFirm: true },
        { type: 'penal', description: 'b', isFirm: true },
      ],
      votingIntegrityPenalty: 50,
      taxCondition: 'no_habido',
    }))
    expect(result.total).toBe(0)
  })

  it('caps at 100 even with bonus', () => {
    const result = calculateEnhancedIntegrity(makeEnhanced({
      votingIntegrityBonus: 50,
    }))
    expect(result.total).toBe(100)
  })

  it('includes all penalty sources in breakdown', () => {
    const result = calculateEnhancedIntegrity(makeEnhanced({
      votingIntegrityPenalty: 5,
      taxCondition: 'no_hallado',
      hasJudicialDiscrepancy: true,
      discrepancySeverity: 'minor',
      companyLaborIssues: 1,
    }))
    expect(result.votingPenalty).toBe(5)
    expect(result.taxPenalty).toBe(20)
    expect(result.omissionPenalty).toBe(20)
    expect(result.companyPenalty).toBe(20)
  })
})

// ============================================
// calculatePerformanceScore
// ============================================

describe('calculatePerformanceScore', () => {
  it('returns null for non-incumbent', () => {
    expect(calculatePerformanceScore(makeEnhanced())).toBeNull()
    expect(calculatePerformanceScore(makeEnhanced({ isIncumbent: false }))).toBeNull()
  })

  it('returns base 50 for incumbent with no data', () => {
    const result = calculatePerformanceScore(makeEnhanced({ isIncumbent: true }))
    expect(result).toBe(50)
  })

  it('boosts for high budget execution', () => {
    const result = calculatePerformanceScore(makeEnhanced({
      isIncumbent: true,
      budgetExecutionPct: 90,
    }))
    // 50 + (90 - 50) * 0.5 = 50 + 20 = 70
    expect(result).toBe(70)
  })

  it('penalizes for contraloria reports', () => {
    const result = calculatePerformanceScore(makeEnhanced({
      isIncumbent: true,
      contraloríaReports: 3,
    }))
    // 50 - 30 = 20
    expect(result).toBe(20)
  })

  it('overrides with direct performanceScore', () => {
    const result = calculatePerformanceScore(makeEnhanced({
      isIncumbent: true,
      budgetExecutionPct: 90,
      contraloríaReports: 5,
      performanceScore: 75,
    }))
    expect(result).toBe(75)
  })

  it('clamps between 0 and 100', () => {
    expect(calculatePerformanceScore(makeEnhanced({
      isIncumbent: true,
      contraloríaReports: 10,
    }))).toBe(0)

    expect(calculatePerformanceScore(makeEnhanced({
      isIncumbent: true,
      performanceScore: 150,
    }))).toBe(100)
  })
})

// ============================================
// calculateAllScores (pipeline)
// ============================================

describe('calculateAllScores', () => {
  it('produces complete score output', () => {
    const data = makeCandidate({
      education: [makeEducation('maestria')],
      experience: [makeExperience({ startYear: 2016, endYear: 2026 })],
    })
    const result = calculateAllScores(data, 'presidente')

    expect(result.competence).toBeDefined()
    expect(result.integrity).toBeDefined()
    expect(result.transparency).toBeDefined()
    expect(result.confidence).toBeDefined()
    expect(result.scores.balanced).toBeDefined()
    expect(result.scores.merit).toBeDefined()
    expect(result.scores.integrityFirst).toBeDefined()
  })

  it('returns max scores for perfect candidate', () => {
    const data = makeCandidate({
      education: [
        makeEducation('doctorado'),
        makeEducation('maestria'),
        makeEducation('titulo_profesional'),
        makeEducation('universitario_completo'),
        makeEducation('tecnico_completo'),
      ],
      experience: [
        makeExperience({
          roleType: 'electivo_alto',
          startYear: 2000,
          endYear: 2026,
          isLeadership: true,
          seniorityLevel: 'direccion',
        }),
      ],
    })
    const result = calculateAllScores(data, 'presidente')

    expect(result.scores.competence).toBe(100)
    expect(result.scores.integrity).toBe(100)
    expect(result.scores.transparency).toBe(100)
    expect(result.scores.balanced).toBe(100)
  })
})

// ============================================
// calculateEnhancedScores (pipeline)
// ============================================

describe('calculateEnhancedScores', () => {
  it('produces complete enhanced output', () => {
    const data = makeEnhanced({
      education: [makeEducation('doctorado')],
      experience: [makeExperience()],
      isIncumbent: true,
      budgetExecutionPct: 80,
    })
    const result = calculateEnhancedScores(data, 'presidente')

    expect(result.competence).toBeDefined()
    expect(result.integrity).toBeDefined()
    expect(result.transparency).toBeDefined()
    expect(result.confidence).toBeDefined()
    expect(result.performance).not.toBeNull()
    expect(result.integrityBreakdown).toBeDefined()
    expect(result.integrityBreakdown.subtotals).toBeDefined()
    expect(result.scores.performance).not.toBeNull()
  })

  it('returns null performance for non-incumbent', () => {
    const data = makeEnhanced({
      education: [makeEducation('doctorado')],
    })
    const result = calculateEnhancedScores(data, 'senador')
    expect(result.performance).toBeNull()
    expect(result.scores.performance).toBeNull()
  })

  it('uses enhanced integrity (not base)', () => {
    const data = makeEnhanced({
      votingIntegrityPenalty: 30,
    })
    const result = calculateEnhancedScores(data, 'presidente')
    // Enhanced integrity should reflect voting penalty
    expect(result.integrity.votingPenalty).toBe(30)
    expect(result.scores.integrity).toBe(70) // 100 - 30
  })
})
