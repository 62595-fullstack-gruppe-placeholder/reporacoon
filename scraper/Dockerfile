FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install git so subprocess calls to `git` work inside the container
# The extra flags are minizing the size of git so the image remains as small as possible
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
	&& apt-get install -y --no-install-recommends git \
	&& rm -rf /var/lib/apt/lists/*
COPY logic.py .
COPY api.py .
COPY repository.py .
COPY tests/ ./tests/

# Copy tests into image so they are available when running `pytest` inside
# the container.  The build context already includes the `tests/` directory.
COPY tests tests

RUN mkdir -p /app/scanlogs

EXPOSE 5001

CMD ["python", "-u", "api.py"]
