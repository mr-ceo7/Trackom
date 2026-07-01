"""Tests for blog endpoints."""

import pytest
from httpx import AsyncClient


class TestBlogPublic:
    async def test_list_posts_empty(self, client: AsyncClient):
        resp = await client.get("/api/v1/blog/posts")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_categories_empty(self, client: AsyncClient):
        resp = await client.get("/api/v1/blog/categories")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_get_post_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v1/blog/posts/nonexistent-slug")
        assert resp.status_code == 404


class TestBlogAdmin:
    async def test_create_category(self, admin_client: AsyncClient):
        resp = await admin_client.post("/api/v1/blog/admin/categories", json={
            "name": "Technology", "slug": "technology", "description": "Tech posts"
        })
        assert resp.status_code == 201
        assert resp.json()["name"] == "Technology"
        assert resp.json()["slug"] == "technology"

    async def test_create_post(self, admin_client: AsyncClient):
        resp = await admin_client.post("/api/v1/blog/admin/posts", json={
            "title": "Hello World", "slug": "hello-world",
            "content": "# Hello\nThis is a test post.", "excerpt": "A test",
            "is_published": True,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Hello World"
        assert data["is_published"] is True
        assert data["published_at"] is not None

    async def test_create_post_duplicate_slug(self, admin_client: AsyncClient):
        await admin_client.post("/api/v1/blog/admin/posts", json={
            "title": "Post 1", "slug": "dupe-slug", "content": "Content"
        })
        resp = await admin_client.post("/api/v1/blog/admin/posts", json={
            "title": "Post 2", "slug": "dupe-slug", "content": "Content"
        })
        assert resp.status_code == 409

    async def test_create_and_list_published(self, admin_client: AsyncClient):
        await admin_client.post("/api/v1/blog/admin/posts", json={
            "title": "Published", "slug": "pub-post", "content": "Yes",
            "is_published": True,
        })
        await admin_client.post("/api/v1/blog/admin/posts", json={
            "title": "Draft", "slug": "draft-post", "content": "No",
            "is_published": False,
        })
        resp = await admin_client.get("/api/v1/blog/posts")
        assert resp.status_code == 200
        posts = resp.json()
        assert len(posts) == 1
        assert posts[0]["slug"] == "pub-post"

    async def test_get_post_by_slug(self, admin_client: AsyncClient):
        await admin_client.post("/api/v1/blog/admin/posts", json={
            "title": "Fetch Me", "slug": "fetch-me", "content": "Body",
            "is_published": True,
        })
        resp = await admin_client.get("/api/v1/blog/posts/fetch-me")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Fetch Me"
        assert resp.json()["view_count"] == 1

    async def test_create_post_unauthenticated(self, client: AsyncClient):
        resp = await client.post("/api/v1/blog/admin/posts", json={
            "title": "No Auth", "slug": "no-auth", "content": "Nope"
        })
        assert resp.status_code == 403

    async def test_create_post_non_admin_forbidden(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/blog/admin/posts", json={
            "title": "Non Admin", "slug": "non-admin", "content": "Nope"
        })
        assert resp.status_code == 403

