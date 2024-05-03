FROM python:slim
WORKDIR /app
COPY . /app
RUN pip install mysql-connector-python pm4py
CMD python index.py /config/config.json
EXPOSE 80