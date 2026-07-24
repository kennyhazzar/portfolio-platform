import { Post } from '../../domain/entities/post.entity';
import { PostAdminDto, PostDto } from '../dtos/post.dto';

export class PostMapper {
  static toDto(entity: Post): PostDto {
    return {
      id: entity.id,
      locale: entity.locale,
      slug: entity.slug,
      title: entity.title,
      excerpt: entity.excerpt,
      body: entity.body,
      seoTitle: entity.seoTitle,
      seoDescription: entity.seoDescription,
      publishedAt: entity.publishedAt,
      viewCount: entity.viewCount,
    };
  }

  static toAdminDto(entity: Post): PostAdminDto {
    return {
      id: entity.id,
      authorUserId: entity.authorUserId,
      status: entity.status,
      publishedAt: entity.publishedAt,
      viewCount: entity.viewCount,
      locale: entity.locale,
      slug: entity.slug,
      title: entity.title,
      excerpt: entity.excerpt,
      body: entity.body,
      seoTitle: entity.seoTitle,
      seoDescription: entity.seoDescription,
    };
  }
}
