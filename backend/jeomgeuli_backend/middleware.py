from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class ApiNotFoundJson(MiddlewareMixin):
    def process_response(self, request, response):
        if request.path.startswith("/api/") and response.status_code == 404:
            return JsonResponse({"error": "Not Found", "path": request.path}, status=404)
        return response
