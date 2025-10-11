#!/bin/bash
set -e

echo "🔍 Checking provider registration status..."

# Check Cosmos DB provider
COSMOS_STATUS=$(az provider show -n Microsoft.DocumentDB --query "registrationState" -o tsv)
echo "Cosmos DB provider: $COSMOS_STATUS"

# Check Container Registry provider
ACR_STATUS=$(az provider show -n Microsoft.ContainerRegistry --query "registrationState" -o tsv)
echo "Container Registry provider: $ACR_STATUS"

if [ "$COSMOS_STATUS" != "Registered" ] || [ "$ACR_STATUS" != "Registered" ]; then
    echo "⏳ Providers still registering. Wait a minute and run this script again."
    exit 1
fi

echo "✅ All providers registered!"
echo ""
echo "📦 Creating Cosmos DB (free tier)..."
az cosmosdb create \
    --name patchpath-cosmos \
    --resource-group patchpath-rg \
    --locations regionName=eastus failoverPriority=0 \
    --enable-free-tier true \
    --kind GlobalDocumentDB

echo "✅ Cosmos DB created!"
echo ""
echo "🐳 Creating Container Registry (Basic tier)..."
az acr create \
    --name patchpathregistry \
    --resource-group patchpath-rg \
    --sku Basic \
    --location eastus

echo "✅ Container Registry created!"
echo ""
echo "🔐 Getting credentials for GitHub secrets..."

# Get Cosmos DB connection string
COSMOS_CONN=$(az cosmosdb keys list \
    --name patchpath-cosmos \
    --resource-group patchpath-rg \
    --type connection-strings \
    --query "connectionStrings[0].connectionString" -o tsv)

# Get ACR credentials
ACR_USERNAME=$(az acr credential show \
    --name patchpathregistry \
    --query "username" -o tsv)

ACR_PASSWORD=$(az acr credential show \
    --name patchpathregistry \
    --query "passwords[0].value" -o tsv)

ACR_LOGIN_SERVER=$(az acr show \
    --name patchpathregistry \
    --resource-group patchpath-rg \
    --query "loginServer" -o tsv)

echo ""
echo "==============================================="
echo "📋 GitHub Secrets to Configure:"
echo "==============================================="
echo ""
echo "AZURE_COSMOS_CONNECTION_STRING="
echo "$COSMOS_CONN"
echo ""
echo "AZURE_REGISTRY_USERNAME=$ACR_USERNAME"
echo "AZURE_REGISTRY_PASSWORD=$ACR_PASSWORD"
echo "AZURE_REGISTRY_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo ""
echo "==============================================="
echo "🎉 Azure setup complete!"
echo "💰 Monthly cost estimate: ~\$5-10 (Basic ACR), Cosmos DB is FREE tier"
echo "==============================================="
