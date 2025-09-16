# apps/chat/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from services.ai import summarize  # safe; summarize never raises

@api_view(["POST"])
def ask(request):
    text = (request.data or {}).get("text", "")
    result = summarize(text)
    # Always return the schema; 200 OK for UX simplicity
    return Response(result, status=status.HTTP_200_OK)


