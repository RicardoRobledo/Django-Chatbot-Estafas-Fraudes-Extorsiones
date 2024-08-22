import json

from asgiref.sync import sync_to_async

from http import HTTPStatus
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views import View
from django.conf import settings
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from django.template.response import TemplateResponse

from ..desing_patterns.creational_patterns.singleton.openai_singleton import OpenAISingleton
from .repositories import chatbot_repository
from .utils.managers import PromptManager


@method_decorator(require_http_methods(["POST"]), name='dispatch')
class SendMessageView(View):

    async def post(self, request, *args, **kwargs):
        body = json.loads(request.body)
        thread_id = body.get('thread_id')
        user_message = body.get('user_message')

        response = await chatbot_repository.send_message(thread_id, user_message)

        return JsonResponse(data=response['data'], status=response['status_code'])


@method_decorator(require_http_methods(["POST"]), name='dispatch')
class SendVoiceMessageView(View):

    async def post(self, request, *args, **kwargs):
        body = json.loads(request.body)
        thread_id = body.get('thread_id')
        user_message = body.get('user_message')

        response = await chatbot_repository.send_voice_message(thread_id, user_message)

        return JsonResponse(data=response['data'], status=response['status_code'])


@method_decorator(require_http_methods(["POST"]), name='dispatch')
class EvaluateConversationView(View):

    async def post(self, request, *args, **kwargs):

        body = json.loads(request.body)
        conversation = body.get('conversation')

        # Sending prompt message
        response = await OpenAISingleton.create_completion_message(conversation)

        return JsonResponse(data=response['data'], status=response['status_code'])


@method_decorator(require_http_methods(["POST"]), name='dispatch')
class CreateThreadView(View):

    async def post(self, request, *args, **kwargs):

        body = json.loads(request.body)
        name = body.get('name')

        thread_id = await OpenAISingleton.create_thread()

        prompt = await PromptManager.read_prompt('prompt_initial_message')
        prompt_result = PromptManager.fill_out_prompt(
            prompt, {'name': name})

        await OpenAISingleton.create_message(thread_id.id, prompt_result)

        return JsonResponse(data={'thread_id': thread_id.id}, status=HTTPStatus.OK)


@method_decorator(require_http_methods(["POST"]), name='dispatch')
class DeleteThreadView(View):

    async def post(self, request, thread_id, *args, **kwargs):
        await OpenAISingleton.delete_thread(thread_id)
        return JsonResponse({})


@method_decorator(never_cache, name='dispatch')
class ChatView(View):

    def get(self, request, *args, **kwargs):
        """
        This method return our chatbot view
        """

        return TemplateResponse(request, 'chatbot/chat.html')
