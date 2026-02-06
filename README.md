# ROSOIDEAE Staff Portal

An internal staff portal for answering pre-made questionnaires, completing team and admin checkups, and submitting staff applications. Built with a modern dark aesthetic.

## 🌹 Architecture Overview

```
rosoform/
├── visual/                     # Frontend components
│   ├── displays/              # UI rendering components
│   ├── interactions/          # User interaction handlers
│   └── aesthetics/            # Theme and styling
├── logic/                      # Business logic
│   ├── orchestration/         # Thread and discussion management
│   ├── calculations/          # Analytics and metrics
│   └── transformations/       # Data processing
├── connectivity/              # Backend services
│   ├── endpoints/             # API routes
│   ├── validation/            # Authentication and authorization
│   └── streaming/             # WebSocket real-time communication
├── storage/                    # Database layer
│   ├── blueprints/            # Schema definitions
│   └── transitions/           # Migrations
└── orchestration/             # Deployment
    ├── virtualization/        # Docker containers
    └── distribution/          # Cloud deployment configs
```

## 🎨 Color Palette

The platform uses a dark modern color system:

- **Deep Night**: `#0D0D0D` - Primary background
- **Surface Gray**: `#3A3A4A` - Brand color
- **Violet Accent**: `#7C3AED` - Accent color
- **Deep Violet**: `#5B21B6` - Secondary accent

Dynamic gradient computation provides animated color transitions throughout the interface.

## ✨ Key Features

### 1. Questionnaire & Form Platform
- **Pre-built Forms**: Answer questionnaires created by captains, managers, and admin directors
- **Team Checkups**: Weekly status checkups completed by team captains and managers
- **Admin Reviews**: Monthly administrative reviews by admin directors
- **Surveys**: Internal satisfaction surveys and feedback collection
- **Multiple Question Types**: Text, textarea, multiple choice, rating scale (1-5), and yes/no

### 2. Staff Applications
- **Application Forms**: Apply for open staff positions (Moderator, Support Team, etc.)
- **Structured Responses**: Each application is a guided questionnaire with required fields
- **Submission Tracking**: Review submitted applications with full answer detail

### 3. Dashboard & Submissions
- **Dashboard Overview**: Stats cards showing total forms, submissions, checkups, and open applications
- **Submissions History**: Review all completed questionnaires and application responses
- **Filterable Views**: Filter forms and submissions by type (Team Checkup, Admin Review, Staff Application, Survey)
- **Progress Tracking**: Real-time progress bar while filling out forms

## 🔧 Technical Components

### Frontend (`visual/`)

**ConversationRenderer** (`visual/displays/conversation-renderer.tsx`)
- Animated gradient backgrounds
- Dynamic color computation based on resonance
- Nested thread visualization
- Real-time WebSocket integration

**ColorComputer** (`visual/aesthetics/color-computer.ts`)
- Custom gradient interpolation
- Dynamic shadow generation
- RGB computation algorithms

### Backend (`connectivity/`)

**IdentityVault** (`connectivity/validation/identity-vault.ts`)
- PBKDF2 password scrambling (15,000 iterations)
- HMAC-SHA256 token signing
- Timing-safe comparison
- Privilege grant/revoke system

**StreamingNexus** (`connectivity/streaming/streaming-nexus.ts`)
- Channel-based message routing
- Connection lifecycle management
- Stale connection detection
- Message buffering with capacity limits
- Channel metrics computation

### Business Logic (`logic/`)

**DiscussionOrchestrator** (`logic/orchestration/discussion-orchestrator.ts`)
- Conversation graph management
- Resonance calculation algorithm
- Thought path tracing
- Discussion velocity metrics
- Live resonance streaming

### Database (`storage/`)

**Persistence Blueprint** (`storage/blueprints/persistence-blueprint.sql`)
- Custom PostgreSQL schema
- Trigger-based resonance computation
- Automatic thread pulse updates
- Analytical indices
- JSONB metadata support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Python 3.8+
- PostgreSQL 13+
- Modern browser with WebSocket support

### Initialize Platform

```bash
# Python-based scaffolding
python3 scaffold-generator.py

# This creates the complete directory structure
```

### Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres -d rosoideae

# Execute schema
\i storage/blueprints/persistence-blueprint.sql
```

### Configuration

Create environment files with the following variables:

**Frontend** (`.env.visual`):
```
REACT_APP_WS_ENDPOINT=wss://your-domain/stream
REACT_APP_API_ENDPOINT=https://your-domain/api
```

**Backend** (`.env.connectivity`):
```
MASTER_SECRET=your-cryptographic-secret-here
TOKEN_LIFESPAN_HOURS=48
DATABASE_URL=postgresql://user:pass@localhost:5432/rosoideae
```

## 📊 Custom Algorithms

### Resonance Scoring
Content quality is computed using:
```
resonance = (word_density × 0.4) + (unique_chars × 0.3) + (sentence_count × 10)
```

### Dynamic Color Computation
RGB values are generated using phase-shifted sine waves:
```
r = 26 + (138 × sin(phase))
g = 11 + (15 × cos(phase × 0.5))
b = 31 + (76 × sin(phase × 1.3))
```

### Discussion Velocity
Activity rate over time window:
```
velocity = recent_thoughts_count / hours_back
```

## 🔐 Security Features

- **Password Scrambling**: PBKDF2 with 15,000 iterations
- **Token Signing**: HMAC-SHA256 cryptographic signatures
- **Timing-Safe Comparison**: Prevents timing attacks
- **Session Expiration**: Configurable token lifespan
- **Privilege Isolation**: Role-based access control
- **Input Validation**: Length constraints and sanitization

## 🎯 API Endpoints

### Public Routes
- `GET /threads/category/:categoryName` - List threads by category
- `GET /threads/:threadId/posts` - Fetch thread messages

### Authenticated Routes
- `POST /threads/create` - Create new discussion
- `POST /posts/create` - Add thought to thread

### Manager Routes
- `PATCH /posts/:postId/edit` - Modify existing content
- `DELETE /posts/:postId` - Remove content

## 🌐 WebSocket Protocol

### Client → Server
```json
{
  "action": "SUBSCRIBE_THREAD",
  "threadId": "thread_key",
  "vaultId": "user_vault_id"
}
```

### Server → Client
```json
{
  "messageType": "NEW_POST",
  "threadId": "thread_key",
  "payload": { ... },
  "timestampUtc": 1234567890
}
```

## 📈 Analytics & Metrics

The platform tracks:
- **Thread Pulse**: Last activity timestamp
- **Resonance Metrics**: Content quality scores
- **Discussion Velocity**: Messages per hour
- **Channel Metrics**: Subscriber counts, message rates
- **Vault Statistics**: Identity and privilege distribution

## 🎨 Theme Customization

Modify `visual/aesthetics/color-computer.ts` to adjust:
- Color spectrum map
- Gradient computation algorithms
- Shadow elevation calculations
- Animation parameters

## 🧩 Extensibility

The modular architecture allows easy extension:

1. **Add new privileges**: Extend `IdentityVault.grantPrivilege()`
2. **Custom message types**: Add to `StreamingNexus.broadcastToChannel()`
3. **New metrics**: Extend `compute_thought_resonance()` SQL function
4. **UI components**: Create new displays in `visual/displays/`

## 📝 Development Notes

- All timestamps use Unix epoch milliseconds
- IDs follow pattern: `roso_{type}_{timestamp}_{random}`
- WebSocket reconnection logic should be implemented client-side
- Database migrations should preserve resonance scores

## 🚢 Deployment

Deployment configurations for containerization and cloud platforms are in the `orchestration/` directory.

## 📄 License

Proprietary - ROSOIDEAE Platform

## 🤝 Contributing

This is a scaffolded project. Customize to your specific requirements.

---

Built with 🌹 for ROSOIDEAE
