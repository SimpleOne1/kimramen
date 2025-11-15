#!/bin/bash
#
# create_structure.sh
#
# This script creates a skeleton directory and file structure for a Next.js project
# using the App Router with an MVC-style organisation and i18n support. It should
# be run after you have created a new Next.js project (e.g. via
# `npx create-next-app`). The script will create nested route segments, API
# route handlers, component folders, models, controllers, services, and i18n
# locales in the `src` directory.
#
# Usage:
#   ./create_structure.sh /path/to/your/project
#
# If no directory is provided, it will operate on the current working directory.

set -e

# Determine the project root. If an argument is given, use it; otherwise use the
# current directory.
PROJECT_DIR="${1:-$(pwd)}"

echo "Creating directory structure under $PROJECT_DIR"

# App router structure (public routes)
mkdir -p "$PROJECT_DIR/src/app/(public)/(catalog)/categories/[categoryId]/products/[productId]"
mkdir -p "$PROJECT_DIR/src/app/(public)/(catalog)/sales"
mkdir -p "$PROJECT_DIR/src/app/(public)/(catalog)/extras"
mkdir -p "$PROJECT_DIR/src/app/(public)/(account)/profile"
mkdir -p "$PROJECT_DIR/src/app/(public)/(about)"
mkdir -p "$PROJECT_DIR/src/app/(public)/(help)/payment-and-shipping"
mkdir -p "$PROJECT_DIR/src/app/(public)/(help)/returns"
mkdir -p "$PROJECT_DIR/src/app/(public)/(help)/contacts"
mkdir -p "$PROJECT_DIR/src/app/(public)/(help)/faq"
mkdir -p "$PROJECT_DIR/src/app/(public)/(blog)/[slug]"
mkdir -p "$PROJECT_DIR/src/app/(public)/(legal)/terms-of-service"
mkdir -p "$PROJECT_DIR/src/app/(public)/(legal)/privacy-policy"
mkdir -p "$PROJECT_DIR/src/app/(public)/(legal)/cookies"
mkdir -p "$PROJECT_DIR/src/app/(public)/(legal)/return-policy"
mkdir -p "$PROJECT_DIR/src/app/(public)/(cart)"
mkdir -p "$PROJECT_DIR/src/app/(public)/(orders)/[orderId]"

# Admin routes
mkdir -p "$PROJECT_DIR/src/app/(admin)/catalog/categories"
mkdir -p "$PROJECT_DIR/src/app/(admin)/catalog/products"
mkdir -p "$PROJECT_DIR/src/app/(admin)/catalog/sales"
mkdir -p "$PROJECT_DIR/src/app/(admin)/orders"
mkdir -p "$PROJECT_DIR/src/app/(admin)/users"
mkdir -p "$PROJECT_DIR/src/app/(admin)/blog"
mkdir -p "$PROJECT_DIR/src/app/(admin)/settings"

# API route handlers
mkdir -p "$PROJECT_DIR/src/app/api/catalog/products"
mkdir -p "$PROJECT_DIR/src/app/api/catalog/categories"
mkdir -p "$PROJECT_DIR/src/app/api/blog/posts"
mkdir -p "$PROJECT_DIR/src/app/api/orders"
mkdir -p "$PROJECT_DIR/src/app/api/auth"
mkdir -p "$PROJECT_DIR/src/app/api/users"

# Create layout and page files with placeholders
touch "$PROJECT_DIR/src/app/layout.tsx"
touch "$PROJECT_DIR/src/app/globals.css"

touch "$PROJECT_DIR/src/app/(public)/layout.tsx"
touch "$PROJECT_DIR/src/app/(public)/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(catalog)/layout.tsx"
touch "$PROJECT_DIR/src/app/(public)/(catalog)/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(catalog)/categories/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(catalog)/categories/[categoryId]/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(catalog)/categories/[categoryId]/products/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(catalog)/categories/[categoryId]/products/[productId]/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(catalog)/sales/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(catalog)/extras/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(account)/layout.tsx"
touch "$PROJECT_DIR/src/app/(public)/(account)/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(account)/profile/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(about)/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(help)/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(help)/payment-and-shipping/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(help)/returns/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(help)/contacts/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(help)/faq/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(blog)/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(blog)/[slug]/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(legal)/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(legal)/terms-of-service/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(legal)/privacy-policy/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(legal)/cookies/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(legal)/return-policy/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(cart)/page.tsx"

touch "$PROJECT_DIR/src/app/(public)/(orders)/page.tsx"
touch "$PROJECT_DIR/src/app/(public)/(orders)/[orderId]/page.tsx"

touch "$PROJECT_DIR/src/app/(admin)/layout.tsx"
touch "$PROJECT_DIR/src/app/(admin)/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/catalog/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/catalog/categories/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/catalog/products/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/catalog/sales/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/orders/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/users/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/blog/page.tsx"
touch "$PROJECT_DIR/src/app/(admin)/settings/page.tsx"

# Create API route files
touch "$PROJECT_DIR/src/app/api/catalog/products/route.ts"
touch "$PROJECT_DIR/src/app/api/catalog/categories/route.ts"
touch "$PROJECT_DIR/src/app/api/blog/posts/route.ts"
touch "$PROJECT_DIR/src/app/api/orders/route.ts"
touch "$PROJECT_DIR/src/app/api/auth/route.ts"
touch "$PROJECT_DIR/src/app/api/users/route.ts"

# Components
mkdir -p "$PROJECT_DIR/src/components/layout"
touch "$PROJECT_DIR/src/components/layout/Header.tsx"
touch "$PROJECT_DIR/src/components/layout/Footer.tsx"
touch "$PROJECT_DIR/src/components/layout/Sidebar.tsx"
touch "$PROJECT_DIR/src/components/layout/Navigation.tsx"

mkdir -p "$PROJECT_DIR/src/components/catalog"
touch "$PROJECT_DIR/src/components/catalog/ProductCard.tsx"
touch "$PROJECT_DIR/src/components/catalog/CategoryList.tsx"
touch "$PROJECT_DIR/src/components/catalog/FilterBar.tsx"
touch "$PROJECT_DIR/src/components/catalog/SalesBanner.tsx"

mkdir -p "$PROJECT_DIR/src/components/account"
touch "$PROJECT_DIR/src/components/account/ProfileCard.tsx"
touch "$PROJECT_DIR/src/components/account/LoginForm.tsx"
touch "$PROJECT_DIR/src/components/account/RegisterForm.tsx"

mkdir -p "$PROJECT_DIR/src/components/help"
touch "$PROJECT_DIR/src/components/help/FaqItem.tsx"
touch "$PROJECT_DIR/src/components/help/ContactForm.tsx"

mkdir -p "$PROJECT_DIR/src/components/blog"
touch "$PROJECT_DIR/src/components/blog/PostPreview.tsx"
touch "$PROJECT_DIR/src/components/blog/AuthorCard.tsx"
touch "$PROJECT_DIR/src/components/blog/Comment.tsx"

mkdir -p "$PROJECT_DIR/src/components/legal"
touch "$PROJECT_DIR/src/components/legal/Document.tsx"

mkdir -p "$PROJECT_DIR/src/components/cart"
touch "$PROJECT_DIR/src/components/cart/CartItem.tsx"
touch "$PROJECT_DIR/src/components/cart/CartSummary.tsx"

mkdir -p "$PROJECT_DIR/src/components/orders"
touch "$PROJECT_DIR/src/components/orders/OrderList.tsx"
touch "$PROJECT_DIR/src/components/orders/OrderDetail.tsx"

mkdir -p "$PROJECT_DIR/src/components/admin"
touch "$PROJECT_DIR/src/components/admin/SidebarMenu.tsx"
touch "$PROJECT_DIR/src/components/admin/DashboardCard.tsx"
touch "$PROJECT_DIR/src/components/admin/Table.tsx"

# Models
mkdir -p "$PROJECT_DIR/src/models"
touch "$PROJECT_DIR/src/models/product.ts"
touch "$PROJECT_DIR/src/models/category.ts"
touch "$PROJECT_DIR/src/models/blogPost.ts"
touch "$PROJECT_DIR/src/models/order.ts"
touch "$PROJECT_DIR/src/models/user.ts"

# Controllers
mkdir -p "$PROJECT_DIR/src/controllers"
touch "$PROJECT_DIR/src/controllers/productController.ts"
touch "$PROJECT_DIR/src/controllers/categoryController.ts"
touch "$PROJECT_DIR/src/controllers/blogController.ts"
touch "$PROJECT_DIR/src/controllers/orderController.ts"
touch "$PROJECT_DIR/src/controllers/userController.ts"

# Services
mkdir -p "$PROJECT_DIR/src/services"
touch "$PROJECT_DIR/src/services/database.ts"
touch "$PROJECT_DIR/src/services/auth.ts"
touch "$PROJECT_DIR/src/services/payment.ts"

# Lib
mkdir -p "$PROJECT_DIR/src/lib"
touch "$PROJECT_DIR/src/lib/api.ts"
touch "$PROJECT_DIR/src/lib/constants.ts"
touch "$PROJECT_DIR/src/lib/hooks.ts"

# i18n support
mkdir -p "$PROJECT_DIR/src/i18n/locales/en"
mkdir -p "$PROJECT_DIR/src/i18n/locales/ru"
touch "$PROJECT_DIR/src/i18n/next-i18next.config.js"
touch "$PROJECT_DIR/src/i18n/locales/en/common.json"
touch "$PROJECT_DIR/src/i18n/locales/en/catalog.json"
touch "$PROJECT_DIR/src/i18n/locales/en/blog.json"
touch "$PROJECT_DIR/src/i18n/locales/ru/common.json"
touch "$PROJECT_DIR/src/i18n/locales/ru/catalog.json"
touch "$PROJECT_DIR/src/i18n/locales/ru/blog.json"

# Styles
mkdir -p "$PROJECT_DIR/src/styles"
touch "$PROJECT_DIR/src/styles/globals.css"
touch "$PROJECT_DIR/src/styles/variables.css"

echo "Structure created successfully."