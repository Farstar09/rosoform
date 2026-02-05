# ROSOIDEAE Platform - Quick Start Guide

## Prerequisites

- Node.js 18+ or Python 3.8+
- PostgreSQL 13+
- Docker & Docker Compose (optional but recommended)
- Modern web browser with WebSocket support

## Option 1: Docker Deployment (Recommended)

### Step 1: Environment Configuration

Create `.env` file in project root:

```bash
# Database Configuration
DB_USERNAME=rosoideae_user
DB_PASSWORD=your_secure_password_here
POSTGRES_DB=rosoideae_production

# Application Secrets
CRYPTO_MASTER_SECRET=your_cryptographic_secret_min_32_chars
TOKEN_LIFESPAN_HOURS=48

# Service Ports
API_PORT=8080
WS_PORT=8081
WEB_PORT=3000
```

### Step 2: Launch Platform

```bash
cd orchestration/virtualization
docker-compose up -d
```

### Step 3: Initialize Database

```bash
# Wait for database to be ready
docker-compose exec rosoideae-database pg_isready

# Run schema initialization
docker-compose exec rosoideae-database psql -U $DB_USERNAME -d rosoideae_production -f /docker-entrypoint-initdb.d/persistence-blueprint.sql
docker-compose exec rosoideae-database psql -U $DB_USERNAME -d rosoideae_production -f /docker-entrypoint-initdb.d/analytics-views.sql
docker-compose exec rosoideae-database psql -U $DB_USERNAME -d rosoideae_production -f /docker-entrypoint-initdb.d/temporal-flow-analysis.sql
```

### Step 4: Access Platform

- Web Interface: http://localhost:3000
- API: http://localhost:8080
- WebSocket: ws://localhost:8081

## Option 2: Manual Setup

### Step 1: Database Setup

```bash
# Create database
createdb rosoideae_production

# Run schemas
psql -d rosoideae_production -f storage/blueprints/persistence-blueprint.sql
psql -d rosoideae_production -f storage/blueprints/analytics-views.sql
psql -d rosoideae_production -f storage/blueprints/temporal-flow-analysis.sql
```

### Step 2: Backend Setup

```bash
cd connectivity/validation
npm install

# Create .env file
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/rosoideae_production" > .env
echo "MASTER_SECRET=your_secret_here" >> .env
echo "TOKEN_LIFESPAN_HOURS=48" >> .env

# Start server (when implemented)
npm run dev
```

### Step 3: Frontend Setup

```bash
cd visual/displays
npm install

# Create .env.visual
echo "REACT_APP_API_ENDPOINT=http://localhost:8080" > .env.visual
echo "REACT_APP_WS_ENDPOINT=ws://localhost:8081" >> .env.visual

# Start development server (when implemented)
npm run dev
```

## Running the Scaffold Generator

```bash
# Python-based scaffold generator
python3 scaffold-generator.py

# This creates the complete directory structure
# and generates configuration files
```

## Testing the Platform

### Check Database Connection

```bash
psql -d rosoideae_production -c "SELECT COUNT(*) FROM roso_identity_registry;"
```

### Test Analytics Functions

```sql
-- Test resonance calculation
SELECT compute_thought_resonance('This is a test discussion with multiple words and sentences. How interesting!');

-- Test entropy calculation  
SELECT calculate_discussion_entropy('thread_id_here');

-- Capture flow snapshot
SELECT capture_flow_snapshot('thread_id_here');
```

### Test Python Modules

```bash
# Test ThoughtWeaver
cd logic/transformations
python3 -c "
from thought_weaver import ThoughtWeaver
weaver = ThoughtWeaver()
waveform = weaver.weave_thought('test_1', 'Sample discussion text', 'author_1', 'general')
print('Waveform generated:', waveform)
"

# Test CrystallizationEngine
python3 -c "
from crystallization_engine import CrystallizationEngine
engine = CrystallizationEngine()
node = engine.nucleate_crystal('Test content for crystal', 'test_author')
print('Crystal node created:', node.node_id)
"
```

## Development Workflow

### 1. Add New Feature

```bash
# Create feature branch
git checkout -b feature/my-new-feature

# Make changes
# Test locally
# Commit with descriptive message
git commit -m "feat: Add my new feature"
```

### 2. Database Migrations

```bash
# Create new migration file
touch storage/transitions/migration_$(date +%Y%m%d%H%M%S).sql

# Add your SQL changes
# Test migration
psql -d rosoideae_production -f storage/transitions/migration_*.sql
```

### 3. Update Analytics

```bash
# Refresh materialized views
psql -d rosoideae_production -c "SELECT refresh_engagement_metrics();"

# Capture flow snapshots
psql -d rosoideae_production -c "SELECT capture_flow_snapshot('thread_id');"
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Verify connection
psql -U rosoideae_user -d rosoideae_production -c "SELECT version();"
```

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :8080
lsof -i :8081
lsof -i :3000

# Kill processes if needed
kill -9 $(lsof -t -i:8080)
```

### Docker Issues

```bash
# View logs
docker-compose logs -f rosoideae-backend

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up -d --build
```

## Performance Tuning

### Database Optimization

```sql
-- Analyze tables
ANALYZE roso_conversation_threads;
ANALYZE roso_thought_nodes;

-- Vacuum database
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Monitor Activity

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

## Security Checklist

- [ ] Change default `CRYPTO_MASTER_SECRET`
- [ ] Use strong database password
- [ ] Enable SSL for database connections
- [ ] Configure firewall rules
- [ ] Set up HTTPS/TLS for production
- [ ] Regular security audits
- [ ] Monitor failed login attempts
- [ ] Implement rate limiting

## Next Steps

1. **Customize Theme**: Edit `visual/aesthetics/color-computer.ts`
2. **Add Categories**: Insert into `roso_discussion_taxonomy` table
3. **Create Admin User**: Use `IdentityVault.registerIdentity()` with admin privileges
4. **Configure Analytics**: Adjust resonance algorithm parameters
5. **Set Up Monitoring**: Implement logging and alerting

## Getting Help

- Review `ARCHITECTURE.md` for detailed technical information
- Check `README.md` for feature descriptions
- Examine code comments for implementation details
- Review SQL function definitions for database logic

## Production Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd orchestration/distribution
vercel --prod
```

### AWS/Cloud Deployment

1. Build Docker images
2. Push to container registry
3. Configure environment variables
4. Set up load balancer
5. Configure auto-scaling
6. Enable monitoring

---

For more information, see the complete documentation in `README.md` and `ARCHITECTURE.md`.
