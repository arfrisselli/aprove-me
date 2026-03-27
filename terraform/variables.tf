variable "aws_region" {
  description = "AWS region para deploy dos recursos"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nome do projeto — prefixo de todos os recursos"
  type        = string
  default     = "aprove-me"
}

variable "environment" {
  description = "Ambiente de deploy (production, staging)"
  type        = string
  default     = "production"
}

variable "backend_image" {
  description = "URI completa da imagem Docker do backend (ex: 123456789.dkr.ecr.us-east-1.amazonaws.com/aprove-me-backend:latest)"
  type        = string
}

variable "frontend_image" {
  description = "URI completa da imagem Docker do frontend"
  type        = string
}

variable "jwt_secret" {
  description = "Segredo JWT — usar AWS Secrets Manager em produção real"
  type        = string
  sensitive   = true
}

variable "ops_email" {
  description = "E-mail do time de operações para alertas"
  type        = string
  default     = "ops@aprovame.com"
}
