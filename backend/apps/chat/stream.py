import os, json
from django.http import StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@csrf_exempt
def chat_stream(request):
    if request.method != "POST":
        return StreamingHttpResponse(iter(["event: error\ndata: method\n\n"]), content_type="text/event-stream")
    try:
        body = json.loads(request.body.decode("utf-8"))
        q = (body.get("query") or "").strip()
        if not q:
            return StreamingHttpResponse(iter(["event: error\ndata: query_required\n\n"]), content_type="text/event-stream")

        def gen():
            try:
                with client.responses.stream(
                    model="gpt-4o-mini",
                    input=f"사용자 질문: {q}\n간결하고 정확하게 한국어로 답해줘.",
                    max_output_tokens=800,
                ) as stream:
                    for event in stream:
                        if event.type == "response.output_text.delta":
                            yield f"data: {event.delta}\n\n"
                    yield "event: done\ndata: [END]\n\n"
            except Exception as e:
                yield f"event: error\ndata: {str(e)}\n\n"

        resp = StreamingHttpResponse(gen(), content_type="text/event-stream")
        resp["Cache-Control"] = "no-cache"
        return resp
    except Exception as e:
        return StreamingHttpResponse(iter([f"event: error\ndata: {str(e)}\n\n"]), content_type="text/event-stream")
