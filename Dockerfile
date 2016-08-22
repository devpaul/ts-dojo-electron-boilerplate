FROM suchja/wine:latest

USER root
RUN apt-get -y update \
	&& apt-get -y upgrade \
	&& apt-get install -y curl wget git nsis python build-essential \
	&& apt-get -y clean
ADD https://raw.githubusercontent.com/isaacs/nave/master/nave.sh /usr/local/bin/nave
RUN printf '#!/bin/bash\nnpm install && grunt $@\n' > /usr/local/bin/start.sh
RUN chmod 555 /usr/local/bin/nave /usr/local/bin/start.sh
RUN /usr/local/bin/nave usemain stable
RUN npm install -g grunt-cli

RUN mkdir -p /src/node_modules
RUN chown xclient.staff /src/node_modules
USER xclient
WORKDIR /src
VOLUME /src
ENTRYPOINT ["/usr/local/bin/start.sh"]
CMD ["wininstaller"]
