import { createContext, useContext, useReducer, ReactNode } from 'react';
import { BaseEntity, SearchResult, CompiledReport, NetworkNode } from '@/types/entities';
import { deduplicateResults, calculateRelevanceScore } from '@/utils/scoring';

interface SkipTracingState {
  compiledResults: SearchResult[];
  entities: BaseEntity[];
  networkNodes: NetworkNode[];
  report: CompiledReport | null;
  searchHistory: string[];
  hasLowResults: boolean;
  filteredResult: SearchResult | null;
  isLoading: {
    basicSearch: boolean;
    phoneSearch: boolean;
    socialSearch: boolean;
    emailSearch: boolean;
    publicRecords: boolean;
  };
}

type SkipTracingAction =
  | { type: 'ADD_RESULTS'; payload: SearchResult[] }
  | { type: 'ADD_ENTITIES'; payload: BaseEntity[] }
  | { type: 'ADD_NETWORK_NODES'; payload: NetworkNode[] }
  | { type: 'GENERATE_REPORT'; payload: Partial<CompiledReport> }
  | { type: 'SET_LOADING'; payload: { module: keyof SkipTracingState['isLoading']; loading: boolean } }
  | { type: 'SET_LOW_RESULTS'; payload: boolean }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'SET_FILTERED_REPORT'; payload: SearchResult }
  | { type: 'CLEAR_ALL' };

const initialState: SkipTracingState = {
  compiledResults: [],
  entities: [],
  networkNodes: [],
  report: null,
  searchHistory: [],
  hasLowResults: false,
  filteredResult: null,
  isLoading: {
    basicSearch: false,
    phoneSearch: false,
    socialSearch: false,
    emailSearch: false,
    publicRecords: false,
  },
};

function skipTracingReducer(state: SkipTracingState, action: SkipTracingAction): SkipTracingState {
  switch (action.type) {
    case 'ADD_RESULTS':
      const newResults = deduplicateResults([...state.compiledResults, ...action.payload]);
      return {
        ...state,
        compiledResults: newResults.sort((a, b) => b.relevanceScore - a.relevanceScore),
        hasLowResults: newResults.length < 5, // Flag low results
      };

    case 'ADD_ENTITIES':
      const newEntities = [...state.entities];
      action.payload.forEach(entity => {
        const exists = newEntities.some(e => 
          e.type === entity.type && 
          e.value.toLowerCase() === entity.value.toLowerCase()
        );
        if (!exists) {
          newEntities.push(entity);
        }
      });
      return { ...state, entities: newEntities };

    case 'ADD_NETWORK_NODES':
      return {
        ...state,
        networkNodes: [...state.networkNodes, ...action.payload],
      };

    case 'GENERATE_REPORT':
      const report: CompiledReport = {
        subject: action.payload.subject || {
          name: 'Unknown',
          lastKnownLocation: 'Unknown',
          searchDate: new Date(),
        },
        summary: {
          totalResults: state.compiledResults.length,
          highConfidenceResults: state.compiledResults.filter(r => r.confidence >= 70).length,
          sourcesCount: new Set(state.compiledResults.map(r => r.source)).size,
          entitiesExtracted: state.entities.length,
        },
        results: state.compiledResults,
        entities: state.entities,
        timeline: action.payload.timeline || [],
        network: state.networkNodes,
        accuracy: {
          overallConfidence: Math.round(
            state.compiledResults.reduce((sum, r) => sum + r.confidence, 0) / 
            (state.compiledResults.length || 1)
          ),
          crossVerified: state.entities.filter(e => e.verified).length,
          flaggedInconsistencies: action.payload.accuracy?.flaggedInconsistencies || [],
        },
      };
      return { ...state, report };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: { ...state.isLoading, [action.payload.module]: action.payload.loading },
      };

    case 'SET_LOW_RESULTS':
      return {
        ...state,
        hasLowResults: action.payload,
      };

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        searchHistory: [...state.searchHistory, action.payload].slice(-20), // Keep last 20
      };

    case 'SET_FILTERED_REPORT':
      return {
        ...state,
        filteredResult: action.payload,
      };

    case 'CLEAR_ALL':
      return initialState;

    default:
      return state;
  }
}

const SkipTracingContext = createContext<{
  state: SkipTracingState;
  dispatch: React.Dispatch<SkipTracingAction>;
} | null>(null);

export function SkipTracingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(skipTracingReducer, initialState);

  return (
    <SkipTracingContext.Provider value={{ state, dispatch }}>
      {children}
    </SkipTracingContext.Provider>
  );
}

export function useSkipTracing() {
  const context = useContext(SkipTracingContext);
  if (!context) {
    throw new Error('useSkipTracing must be used within a SkipTracingProvider');
  }
  return context;
}