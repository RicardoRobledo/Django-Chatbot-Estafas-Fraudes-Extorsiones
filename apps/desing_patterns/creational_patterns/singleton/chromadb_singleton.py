from django.conf import settings

from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

import chromadb


__author__ = 'Ricardo'
__version__ = '0.1'


class ChromaSingleton():

    __client = None
    __embedding = None

    @classmethod
    def __get_connection(self, embedding):
        """
        This method create our client
        """

        client = chromadb.PersistentClient(path="./chroma_db")

        return Chroma(client=client, collection_name="fraudes_estafas_extorsiones", embedding_function=embedding)

    def __new__(cls, *args, **kwargs):

        if cls.__client == None:
            cls.__embedding = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY, model=settings.EMBEDDING_MODEL)
            cls.__client = cls.__get_connection(cls.__embedding)

        return cls.__client

    @classmethod
    def search_similarity_procedure(cls, message: str):
        """
        This method search the similarity in a text given inside ChromaDB

        :param message: an string beging our text to query
        :return: a list with our documents
        """

        docs = cls.__client.similarity_search(message, k=3)

        return docs
