# Option la plus réaliste et gratuite

1. Oracle CLoud Free Tier
2. Des VM gratuites en continu (Always free), suffisantes pour un backend Node + MySQL + Nginx
3. Terraform peut provisionner Oracle Cloud
4. Ansible peut configurer les VM exactement comme avec AWS

# Autres option gratuites possibles

1. Google CLoud free trial
2. Credits temporaires, bien pour PoC mais moins stable dans la durée
3. Azure for students
4. Crédit gratuits sans carte dans certains cas
5. Local lab sur le PC
6. Terraform + provider local (Docker ou libvirt) + Ansible sur VMs locales
7. Très bien pour démonstration académique si cloud indisponible
8. Plateformes PaaS gratuites (Render, Railway, Fly)
9. Bien pour héberger l'app, mais moins adaptées pour démontrer Terraform + Ansible complet

# Suggestion pour le projet
1. Option A : Oracle Cloud Free Tier pour rester dans la logique cloud réelle
2. Option B : Environnement local reproductible pour ne pas être bloquée
3. Garder la même architecture Terraform modules + playbooks Ansible, seule la cible change

# Architecture gratuite type (simple et solide)

1. VM 1: app Node + Prisma
2. VM 2: MySQL
3. Reverse proxy Nginx + TLS (Let’s Encrypt gratuit)
4. GitHub Actions pour tests, coverage, build, puis déploiement Ansible

# Ressources gratuites utiles

1. GitHub Actions (quota gratuit)
2. SonarCloud (souvent gratuit pour public, ou organisation académique)
3. Snyk free plan (limité mais utile)
4. Let’s Encrypt pour certificats TLS
5. Docker et Docker Compose localement