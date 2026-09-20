from django.urls import path

from . import views

urlpatterns = [
    path("", views.ementa, name="ementa"),
    path("reservar/", views.reservar, name="reservar"),
]
