# 🚨 Atualização Rápida: Funcionalidades, Segurança e Configuração

## Autenticação & Gestão de Utilizadores
- **Identificação:** Login e registo são feitos com o número de identificação (ID). O email nunca é mostrado na interface.
- **Admins:** Podem criar novos utilizadores (ID, nome, password, função). Em breve: lista e gestão de utilizadores.

## Segurança & Privacidade
- **Sem Dados Pessoais:** Não são guardados nem exibidos emails, telefones, etc.
- **Regras Firestore:** Apenas utilizadores autenticados podem ler/escrever os seus próprios dados. Admins podem gerir funções e estado dos utilizadores.
- **Conformidade GDPR:** O sistema evita dados pessoais e segue normas europeias de privacidade.

## Hierarquia de Permissões e Acesso por Função

A aplicação implementa uma hierarquia de permissões baseada no papel (role) do utilizador. Cada nível superior herda o acesso dos níveis inferiores:

- **Visitante**
  - Apenas acesso à página principal (Home).

- **Voluntário**
  - Acesso à página principal (Home)
  - Acesso ao Calendário
  - Acesso à Recolha de Dados

- **Coordenador**
  - Todas as permissões de Voluntário
  - Gestão de Eventos (Event Management) *(quando disponível)*

- **Administrador**
  - Todas as permissões de Coordenador
  - Acesso à área de Administração (Admin)

> Nota: Cada nível tem acesso a todas as funcionalidades dos níveis abaixo.

## Localização
- **Idioma:** Toda a interface está em Português Europeu. Traduções em `src/utils/translations.ts`.

## Instalação & Deploy
1. Instalar dependências:
   ```bash
   cd crisis-line-web
   npm install
   ```
2. Iniciar servidor de desenvolvimento:
   ```bash
   npm start
   ```
3. Deploy das regras Firestore:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Atualizar config Firebase:
   Editar `src/services/firebase/config.ts` com as credenciais do projeto.

## Checklist de Progresso
- [x] Login/Registo por ID
- [x] Página Home (ID visível)
- [x] Traduções PT-EU
- [x] Criação de utilizadores (Admin)
- [x] Regras Firestore e deploy
- [ ] Listagem e gestão de utilizadores (Admin)
- [ ] Calendário e presenças
- [ ] Integração redes sociais
- [ ] Métricas e registo de dados
- [ ] Responsividade e acessibilidade

#### A. Event Management (CRUD)
- [ ] Event creation, editing, and deletion (all event types)
- [ ] Publish/unpublish events
- [ ] Recurring event creation (with restrictions, preview, and batch creation)
  - [ ] Permitir ao utilizador escolher o padrão de recorrência: apenas dias de semana, apenas fins de semana, ou todos os dias
- [ ] Event restrictions (dates/periods)

#### B. Event Listing & Filtering
- [ ] List all events user is allowed to see/sign up for (by role)
- [ ] Show event details (participants, capacity, etc.)
- [ ] "Modo Meus Eventos" no calendário (apenas eventos em que o utilizador está inscrito)

#### G. Notifications (Future)
- [ ] Sinal de notificações (notification bell) para inscrições em eventos, inscrições forçadas e alterações de presenças

---

# Crisis Line Web Application Guide

## Overview
This document serves as a comprehensive guide for the Crisis Line Web Application, detailing its current functionality, architecture, and transition plan from React Native to a web-based application.

## Current Application Structure

### Core Features
1. **Authentication System**
   - Role-based access control
   - User roles: Administrador, Coordenador, Voluntário, Visitante
   - Firebase Authentication integration

2. **Calendar & Event Management**
   - Event creation and management
   - Event types: Turno, Teambuilding, Evento Aberto, Reunião Coordenação
   - Event status: draft/published
   - Capacity management
   - User sign-up system
   - Real-time updates for event changes

3. **User Management**
   - Role-based permissions
   - User profile management
   - Anonymous user identification (ID numbers only)

### Technical Stack
- **Frontend**: React Native
- **Backend**: Firebase
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **State Management**: React Context

## Transition Plan

### New Architecture

#### Frontend (React + TypeScript + Tailwind)
```
src/
├── components/
│   ├── calendar/           # Calendar implementation
│   ├── social-feed/        # Social media integration
│   ├── forms/             # Data collection forms
│   └── attendance/        # Attendance tracking
├── pages/
│   ├── Home/             # Social media feed
│   ├── Calendar/         # Event management
│   ├── DataCollection/   # New data registration
│   └── Admin/           # Admin features
└── services/
    ├── firebase/         # Firebase integration
    ├── social/           # Social media API integration
    └── analytics/        # Data analysis services
```

#### Backend (Node.js + Express)
```
src/
├── routes/
│   ├── events/
│   ├── attendance/
│   ├── social/
│   └── analytics/
├── services/
│   ├── firebase/
│   ├── social/
│   └── analytics/
└── middleware/
    ├── auth/
    └── validation/
```

### Key Changes

1. **Calendar System**
   - Migration from react-native-calendars to @fullcalendar/react
   - Enhanced real-time updates
   - Offline calendar viewing capability
   - Attendance tracking for "Reunião Coordenação" events

2. **Social Media Integration**
   - New home page with social media feed
   - Integration with multiple platforms:
     - Instagram
     - Facebook
     - TikTok
     - LinkedIn
     - YouTube
   - Post synchronization system

3. **Data Collection System**
   - New form builder system
   - Basic validation rules
   - Analytics-friendly data storage
   - Metrics analysis capabilities

4. **Attendance Tracking**
   - Special tracking for "Reunião Coordenação" events
   - Historical attendance records
   - Highlight for consecutive misses (2 or 3)
   - Role-based access (Coordenador and up)

### Database Structure

```typescript
// Events Collection
interface Event {
  id: string;
  title: string;
  description: string;
  type: 'Reunião Coordenação' | 'Turno' | 'Teambuilding' | 'Evento Aberto';
  startTime: Date;
  endTime: Date;
  maxCapacity: number;
  requiresAttendance: boolean;
  status: 'draft' | 'published';
  coordinatorUid: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Collection
interface Attendance {
  eventId: string;
  userId: string;
  status: 'present' | 'absent';
  markedBy: string;
  markedAt: Date;
}

// Users Collection
interface User {
  id: string;
  role: 'Administrador' | 'Coordenador' | 'Voluntário' | 'Visitante';
  idNumber: string;
  createdAt: Date;
  lastLogin: Date;
}

// Form Data Collection
interface FormData {
  id: string;
  userId: string;
  formType: string;
  data: Record<string, any>;
  submittedAt: Date;
  analyzed: boolean;
  analysisResults?: Record<string, any>;
}
```

## Security Considerations

1. **Data Privacy**
   - No personal information storage
   - Anonymous user identification
   - Encrypted ID numbers
   - Role-based access control

2. **Authentication**
   - Firebase Authentication
   - Session management
   - Secure token handling

3. **Data Protection**
   - Input validation
   - Data sanitization
   - Secure API endpoints

## Mobile Considerations

1. **Responsive Design**
   - Mobile-first approach
   - Touch-friendly interfaces
   - Optimized for various screen sizes

2. **Performance**
   - Optimized loading times
   - Efficient data caching
   - Minimal network requests

## Implementation Phases

### Phase 1: Core Structure ✅
- [x] Project setup with TypeScript
- [x] Install core dependencies
- [x] Configure Tailwind CSS
- [x] Set up Firebase configuration
- [x] Create basic routing structure
- [x] Implement AuthContext
- [x] Create Login page
- [x] Create basic Home page
- [ ] Create placeholder pages for missing routes:
  - [ ] Calendar page
  - [ ] DataCollection page
  - [ ] Admin page
- [ ] Set up navigation layout
- [ ] Implement protected routes
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test authentication flow
- [ ] Implement ID number-based authentication
- [ ] Create internal email generation system
- [ ] Add user management interface for admins

### Phase 2: Calendar Implementation
- [ ] Set up FullCalendar integration
- [ ] Create calendar view component
- [ ] Implement event display
- [ ] Add event creation form
- [ ] Add event editing functionality
- [ ] Implement event deletion
- [ ] Add event status management (draft/published)
- [ ] Implement event capacity management
- [ ] Add user sign-up system
- [ ] Implement real-time updates
- [ ] Add offline calendar viewing
- [ ] Test calendar functionality

### Phase 3: Attendance Tracking
- [ ] Create attendance tracking interface
- [ ] Implement attendance marking system
- [ ] Add attendance history view
- [ ] Create attendance reports
- [ ] Implement consecutive misses highlighting
- [ ] Add role-based access control
- [ ] Test attendance system

### Phase 4: Data Collection
- [ ] Create form builder system
- [ ] Implement form validation
- [ ] Add data storage structure
- [ ] Create data analysis interface
- [ ] Implement metrics calculation
- [ ] Add data export functionality
- [ ] Test data collection system

### Phase 5: Social Media Integration
- [ ] Set up social media API connections
- [ ] Create social media feed component
- [ ] Implement post synchronization
- [ ] Add post caching system
- [ ] Create post display interface
- [ ] Implement post filtering
- [ ] Test social media integration

### Phase 6: Enhancement & Optimization
- [ ] Implement error boundaries
- [ ] Add loading skeletons
- [ ] Optimize performance
- [ ] Add responsive design improvements
- [ ] Implement caching strategies
- [ ] Add analytics tracking
- [ ] Test all features
- [ ] Fix bugs and issues

### Phase 7: Deployment
- [ ] Set up Vercel deployment
- [ ] Configure Firebase hosting
- [ ] Set up environment variables
- [ ] Configure build process
- [ ] Test production build
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Set up error tracking

## Current Status
We are currently in Phase 1, with the following completed:
- ✅ Project setup with TypeScript
- ✅ Install core dependencies
- ✅ Configure Tailwind CSS
- ✅ Set up Firebase configuration
- ✅ Create basic routing structure
- ✅ Implement AuthContext
- ✅ Create Login page
- ✅ Create basic Home page

Next steps:
1. Create placeholder pages for missing routes
2. Set up navigation layout
3. Implement protected routes

## Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "@fullcalendar/react": "latest",
    "@fullcalendar/daygrid": "latest",
    "@fullcalendar/timegrid": "latest",
    "tailwindcss": "latest",
    "@headlessui/react": "latest",
    "@heroicons/react": "latest",
    "firebase": "latest",
    "socket.io-client": "latest",
    "@tanstack/react-query": "latest",
    "react-router-dom": "latest"
  }
}
```

## Development Guidelines

1. **Code Style**
   - TypeScript for type safety
   - ESLint for code quality
   - Prettier for formatting

2. **Component Structure**
   - Functional components
   - Hooks for state management
   - Custom hooks for reusable logic

3. **Testing**
   - Unit tests for utilities
   - Integration tests for components
   - E2E tests for critical paths

## Deployment

### Hosting Options
- Frontend: Vercel (free tier)
- Backend: Firebase Hosting (free tier)
- Database: Firebase (free tier)

### Environment Setup
- Development environment
- Staging environment
- Production environment

## Future Considerations

1. **Scalability**
   - Database optimization
   - Caching strategies
   - Load balancing

2. **Feature Expansion**
   - Advanced analytics
   - Enhanced reporting
   - Additional social media integrations

3. **Performance Optimization**
   - Code splitting
   - Lazy loading
   - Asset optimization

## Maintenance

1. **Regular Updates**
   - Dependency updates
   - Security patches
   - Performance monitoring

2. **Backup Strategy**
   - Database backups
   - Configuration backups
   - Disaster recovery plan

## Support

1. **Documentation**
   - API documentation
   - User guides
   - Developer documentation

2. **Issue Tracking**
   - Bug reporting
   - Feature requests
   - Performance issues

## Important Security Notes
- Users are identified and authenticated using their ID numbers only
- Email addresses are used internally for Firebase authentication but are NEVER exposed to users
- Only administrators can see user UIDs and email addresses in the user management interface
- All user-facing interfaces must use ID numbers for identification
- User data must be stored with ID numbers as the primary identifier
- Email addresses are generated internally using the pattern: `idnumber@crisisline.internal` 