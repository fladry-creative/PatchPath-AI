#!/bin/bash

# PatchPath MCP Server - Azure Deployment Script
# This script deploys the MCP server to Azure Container Apps from scratch

set -e  # Exit on error

echo "🚀 PatchPath MCP Server - Azure Deployment"
echo "=========================================="
echo ""

# Configuration
RESOURCE_GROUP="patchpath-rg"
LOCATION="eastus"
ACR_NAME="patchpathacr"
CONTAINER_APP_ENV="patchpath-env"
CONTAINER_APP_NAME="patchpath-mcp"
IMAGE_NAME="patchpath-mcp"

# Check if logged in to Azure
echo "📋 Checking Azure login..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Running 'az login'..."
    az login
else
    echo "✅ Already logged in to Azure"
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "📌 Using subscription: $SUBSCRIPTION"
echo ""

# Step 1: Create Resource Group
echo "1️⃣  Creating Resource Group..."
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "   ✅ Resource group '$RESOURCE_GROUP' already exists"
else
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION
    echo "   ✅ Resource group created"
fi
echo ""

# Step 2: Create Container Registry
echo "2️⃣  Creating Azure Container Registry..."
if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "   ✅ Container registry '$ACR_NAME' already exists"
else
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --location $LOCATION \
        --admin-enabled true
    echo "   ✅ Container registry created"
fi
echo ""

# Step 3: Build and Push Docker Image
echo "3️⃣  Building and pushing Docker image..."
echo "   (This may take 2-3 minutes...)"
az acr build \
    --registry $ACR_NAME \
    --image $IMAGE_NAME:latest \
    --file Dockerfile.mcp \
    .
echo "   ✅ Docker image built and pushed"
echo ""

# Step 4: Create Container Apps Environment
echo "4️⃣  Creating Container Apps Environment..."
if az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "   ✅ Container Apps environment already exists"
else
    az containerapp env create \
        --name $CONTAINER_APP_ENV \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION
    echo "   ✅ Container Apps environment created"
fi
echo ""

# Step 5: Get environment variables (or use defaults)
echo "5️⃣  Configuring environment variables..."
if [ -f .env.local ]; then
    echo "   Loading from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "   ⚠️  No .env.local found - you'll need to set secrets manually"
fi

# Check for required secrets
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "   ⚠️  ANTHROPIC_API_KEY not set"
    echo "   💡 Set it with: export ANTHROPIC_API_KEY='your-key'"
fi
if [ -z "$COSMOS_ENDPOINT" ]; then
    echo "   ⚠️  COSMOS_ENDPOINT not set"
fi
if [ -z "$COSMOS_KEY" ]; then
    echo "   ⚠️  COSMOS_KEY not set"
fi
echo ""

# Step 6: Deploy Container App
echo "6️⃣  Deploying MCP Server to Azure Container Apps..."

# Get ACR credentials
ACR_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query passwords[0].value -o tsv)

# Check if container app exists
if az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "   Updating existing container app..."
    az containerapp update \
        --name $CONTAINER_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --image $ACR_SERVER/$IMAGE_NAME:latest
else
    echo "   Creating new container app..."
    az containerapp create \
        --name $CONTAINER_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_APP_ENV \
        --image $ACR_SERVER/$IMAGE_NAME:latest \
        --target-port 3001 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 3 \
        --cpu 0.5 \
        --memory 1.0Gi \
        --registry-server $ACR_SERVER \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --env-vars \
            NODE_ENV=production \
            PORT=3001 \
            COSMOS_DATABASE=patchpath-db

    # Add secrets if available
    if [ ! -z "$ANTHROPIC_API_KEY" ] && [ ! -z "$COSMOS_ENDPOINT" ] && [ ! -z "$COSMOS_KEY" ]; then
        az containerapp secret set \
            --name $CONTAINER_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --secrets \
                anthropic-key="$ANTHROPIC_API_KEY" \
                cosmos-endpoint="$COSMOS_ENDPOINT" \
                cosmos-key="$COSMOS_KEY"

        # Update env vars to use secrets
        az containerapp update \
            --name $CONTAINER_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --set-env-vars \
                ANTHROPIC_API_KEY=secretref:anthropic-key \
                COSMOS_ENDPOINT=secretref:cosmos-endpoint \
                COSMOS_KEY=secretref:cosmos-key
    fi
fi

echo "   ✅ Container app deployed"
echo ""

# Step 7: Get the public URL
echo "7️⃣  Getting deployment info..."
FQDN=$(az containerapp show \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn \
    --output tsv)

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📡 MCP Server URL:"
echo "   https://$FQDN"
echo ""
echo "🏥 Health Check:"
echo "   curl https://$FQDN/health"
echo ""
echo "🔌 MCP Endpoint (for Claude Desktop):"
echo "   https://$FQDN/sse"
echo ""
echo "📝 Claude Desktop Config:"
echo '   {
     "mcpServers": {
       "patchpath-ai": {
         "url": "https://'$FQDN'/sse",
         "transport": "sse"
       }
     }
   }'
echo ""
echo "📊 View logs:"
echo "   az containerapp logs tail --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test health endpoint: curl https://$FQDN/health"
echo "   2. Configure Claude Desktop with the MCP endpoint above"
echo "   3. Start chatting about modular synthesis!"
echo ""
echo "=========================================="
