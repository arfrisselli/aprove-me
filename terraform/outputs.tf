output "alb_dns_name" {
  description = "DNS público do Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "backend_ecr_url" {
  description = "URL do repositório ECR do backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_url" {
  description = "URL do repositório ECR do frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "redis_endpoint" {
  description = "Endpoint do ElastiCache Redis"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "ecs_cluster_name" {
  description = "Nome do cluster ECS"
  value       = aws_ecs_cluster.main.name
}
