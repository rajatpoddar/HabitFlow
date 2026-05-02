#!/bin/bash

# HabitFlow Supabase Sync Script
# This script automates the process of pushing database migrations to your live Supabase project.

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting HabitFlow Database Sync...${NC}"

# 1. Check if logged in
echo -e "${BLUE}Checking Supabase login status...${NC}"
if ! npx supabase projects list &> /dev/null
then
    echo -e "${RED}❌ You are not logged into Supabase CLI.${NC}"
    echo -e "Please run: ${GREEN}npx supabase login${NC}"
    exit 1
fi

# 2. Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${RED}❌ Project is not linked.${NC}"
    read -p "Please enter your Supabase Project Ref (from Dashboard -> Settings): " project_ref
    if [ -z "$project_ref" ]; then
        echo -e "${RED}Project Ref is required. Exiting.${NC}"
        exit 1
    fi
    echo -e "${BLUE}Linking project ${project_ref}...${NC}"
    npx supabase link --project-ref "$project_ref"
fi

# 3. Push migrations
echo -e "${BLUE}Pushing migrations to live database...${NC}"
npx supabase db push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database sync successful! Your live project is now up to date.${NC}"
else
    echo -e "${RED}❌ Database sync failed. Please check the errors above.${NC}"
    exit 1
fi
