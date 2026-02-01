FROM mcr.microsoft.com/devcontainers/base:debian

ARG USERNAME=vscode \
    WORKSPACE=/home/${USERNAME}/app \
    BUN_VERSION="1.3.3"

USER ${USERNAME}
WORKDIR /home/${USERNAME}

RUN curl -fsSL https://bun.com/install \
    | bash -s "bun-v${BUN_VERSION}" \
    && mkdir -p ${WORKSPACE}/node_modules
