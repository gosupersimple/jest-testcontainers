import { DockerComposeEnvironment, Wait, StartedTestContainer, TestContainer } from "testcontainers";
import {
  DockerComposeConfig,
  JestTestcontainersConfig,
  SingleContainerConfig
} from "../config";
import {
  AllStartedContainersAndMetaInfo,
  buildDockerComposeEnvironment,
  buildTestcontainer,
  getMetaInfo,
  startAllContainers,
  startContainer,
  startDockerComposeContainers,
  StartedContainerAndMetaInfo
} from "../containers";

describe("containers", () => {
  describe("buildTestcontainer", () => {
    it("should create simple container with image only", () => {
      const config: SingleContainerConfig = { image: "redis", };

      const actualContainer: any = buildTestcontainer(config);

      expect(actualContainer.image).toEqual("redis:latest");
    });

    it("should set tag correctly", () => {
      const config: SingleContainerConfig = {
        image: "redis",
        tag: "5.0.5"
      };

      const actualContainer: any = buildTestcontainer(config);

      expect(actualContainer.image).toEqual("redis:5.0.5");
      // expect(actualContainer.tag).toEqual("5.0.5");
      // expect(actualContainer.ports).toEqual([]);
      // expect(actualContainer.environment).toEqual({});
      // expect(actualContainer.waitStrategy).toEqual(undefined);
      // expect(actualContainer.startupTimeout).toEqual(60000);
      // expect(actualContainer.bindMounts).toEqual([]);
    });

    it("should set ports correctly", () => {
      const config: SingleContainerConfig = {
        image: "redis",
        ports: [6379]
      };

      const actualContainer: any = buildTestcontainer(config);

      expect(actualContainer.image).toEqual("redis:latest");
      // expect(actualContainer.tag).toEqual("latest");
      // expect(actualContainer.ports).toEqual([6379]);
      // expect(actualContainer.environment).toEqual({});
      // expect(actualContainer.waitStrategy).toEqual(undefined);
      // expect(actualContainer.startupTimeout).toEqual(60000);
      // expect(actualContainer.bindMounts).toEqual([]);
    });

    it("should set name correctly", () => {
      const config: SingleContainerConfig = {
        image: "redis",
        ports: [6379],
        name: "container-name"
      };

      const actualContainer: any = buildTestcontainer(config);

      expect(actualContainer.image).toEqual("redis:latest");
      // expect(actualContainer.tag).toEqual("latest");
      // expect(actualContainer.ports).toEqual([6379]);
      // expect(actualContainer.name).toEqual("container-name");
      // expect(actualContainer.environment).toEqual({});
      // expect(actualContainer.waitStrategy).toEqual(undefined);
      // expect(actualContainer.startupTimeout).toEqual(60000);
      // expect(actualContainer.bindMounts).toEqual([]);
    });

    it("should port wait strategy correctly", () => {
      const config: SingleContainerConfig = {
        image: "redis",
        wait: {
          timeout: 30,
          type: "ports"
        }
      };

      const actualContainer: any = buildTestcontainer(config);

      expect(actualContainer.image).toEqual("redis:latest");
      // expect(actualContainer.tag).toEqual("latest");
      // expect(actualContainer.ports).toEqual([]);
      // expect(actualContainer.environment).toEqual({});
      expect(actualContainer.waitStrategy).toEqual({"startupTimeout": 60000, "startupTimeoutSet": false});
      // expect(actualContainer.startupTimeout).toEqual(30000);
      // expect(actualContainer.bindMounts).toEqual([]);
    });

    it("should text wait strategy correctly", () => {
      const config: SingleContainerConfig = {
        image: "redis",
        wait: {
          text: "hello, world",
          type: "text"
        }
      };

      const actualContainer: any = buildTestcontainer(config);

      expect(actualContainer.image).toEqual("redis:latest");
      // expect(actualContainer.tag).toEqual("latest");
      // expect(actualContainer.ports).toEqual([]);
      // expect(actualContainer.environment).toEqual({});
      expect(actualContainer.waitStrategy).toEqual(
        Wait.forLogMessage("hello, world")
      );
      // expect(actualContainer.startupTimeout).toEqual(60000);
      // expect(actualContainer.bindMounts).toEqual([]);
    });
  });

  describe("buildDockerComposeEnvironment", () => {
    it("should create simple docker compose environment", () => {
      const dockerComposeConfig: DockerComposeConfig = {
        composeFilePath: ".",
        composeFile: "docker-compose.yml"
      };
      const nameRegex = new RegExp(/testcontainers-[0-9A-F]{12}/i);

      const actualEnvironment: any = buildDockerComposeEnvironment(
        dockerComposeConfig
      );

      expect(actualEnvironment.projectName).toEqual(
        expect.stringMatching(nameRegex)
      );
    });

    it("should set startup timeout correctly", () => {
      const dockerComposeConfig: DockerComposeConfig = {
        composeFilePath: ".",
        composeFile: "docker-compose.yml",
        startupTimeout: 60000
      };
      const nameRegex = new RegExp(/testcontainers-[0-9A-F]{32}/i);

      const actualEnvironment: any = buildDockerComposeEnvironment(
        dockerComposeConfig
      );

      expect(actualEnvironment.startupTimeout).toEqual(60000);
    });
  });

  describe("getMetaInfo", () => {
    it("should work with no ports", () => {
      const host = "localhost";
      const name = "container-name";
      const startedContainer: StartedTestContainer = ({
        getHost: jest.fn(() => host),
        getName: jest.fn(() => name)
      } as unknown) as StartedTestContainer;
      const expectedMetaInfo: StartedContainerAndMetaInfo = {
        name,
        container: startedContainer,
        ip: host,
        portMappings: new Map<number, number>()
      };

      const actualMetaInfo = getMetaInfo(startedContainer);

      expect(actualMetaInfo).toEqual(expectedMetaInfo);
    });

    it("should work with empty ports", () => {
      const host = "localhost";
      const name = "container-name";
      const ports: number[] = [];
      const boundPorts = new Map<number, number>();
      const startedContainer: StartedTestContainer = ({
        getHost: jest.fn(() => host),
        getName: jest.fn(() => name),
        getMappedPort: jest.fn(port => boundPorts.get(port))
      } as unknown) as StartedTestContainer;
      const expectedMetaInfo: StartedContainerAndMetaInfo = {
        name,
        container: startedContainer,
        ip: host,
        portMappings: boundPorts
      };

      const actualMetaInfo = getMetaInfo(startedContainer, ports);

      expect(actualMetaInfo).toEqual(expectedMetaInfo);
    });

    it("should work with ports", () => {
      const host = "localhost";
      const name = "container-name";
      const ports = [1, 3, 4];
      const boundPorts = new Map<number, number>([
        [1, 2],
        [3, 4]
      ]);
      const startedContainer: StartedTestContainer = ({
        getHost: jest.fn(() => host),
        getName: jest.fn(() => name),
        getMappedPort: jest.fn(port => boundPorts.get(port))
      } as unknown) as StartedTestContainer;
      const expectedMetaInfo: StartedContainerAndMetaInfo = {
        name,
        container: startedContainer,
        ip: host,
        portMappings: boundPorts
      };

      const actualMetaInfo = getMetaInfo(startedContainer, ports);

      expect(actualMetaInfo).toEqual(expectedMetaInfo);
    });
  });

  describe("startContainer", () => {
    it("should call builder and getter functions", async () => {
      const ports = [1];
      const boundPorts = new Map<number, number>([[1, 2]]);
      const startedContainer = ({} as unknown) as StartedTestContainer;
      const container: TestContainer = ({
        start: jest.fn(() => Promise.resolve(startedContainer))
      } as unknown) as TestContainer;
      const containerBuilderFn: any = jest.fn(() => container);
      const expectedMetaResult: StartedContainerAndMetaInfo = {
        container: startedContainer,
        ip: "localhost",
        name: "container-name",
        portMappings: boundPorts
      };
      const getMetaInfoFn: any = jest.fn(() => expectedMetaResult);
      const config: SingleContainerConfig = {
        image: "test",
        ports,
        tag: "latest"
      };

      const actualMetaResult = await startContainer(
        config,
        containerBuilderFn,
        getMetaInfoFn
      );

      expect(actualMetaResult).toEqual(expectedMetaResult);
      expect(getMetaInfoFn).toHaveBeenCalledWith(startedContainer, ports);
      expect(container.start).toHaveBeenCalledWith();
      expect(containerBuilderFn).toHaveBeenCalledWith(config);
    });
  });

  describe("startDockerComposeContainers", () => {
    it("should call builder and getter functions", async () => {
      const ports = [1];
      const boundPorts = new Map<number, number>([[1, 2]]);
      const startedContainer = ({
        containerName: "container-name",
        boundPorts: {
          ports: boundPorts
        }
      } as unknown) as StartedTestContainer;
      const containerMeta: StartedContainerAndMetaInfo = {
        container: startedContainer,
        ip: "localhost",
        name: "container-name",
        portMappings: boundPorts
      };
      const environment: DockerComposeEnvironment = ({
        up: jest.fn(() =>
          Promise.resolve({
            startedGenericContainers: {
              "container-name": startedContainer
            }
          })
        )
      } as unknown) as DockerComposeEnvironment;
      const dockerComposeBuilderFn: any = jest.fn(() => environment);
      const expectedMetaResult: AllStartedContainersAndMetaInfo = {
        "container-name": containerMeta
      };
      const getMetaInfoFn: any = jest.fn(() => containerMeta);
      const dockerComposeConfig: DockerComposeConfig = {
        composeFilePath: ".",
        composeFile: "docker-compose.yml",
        startupTimeout: 1000
      };

      const actualMetaResult = await startDockerComposeContainers(
        dockerComposeConfig,
        dockerComposeBuilderFn,
        getMetaInfoFn
      );

      expect(actualMetaResult).toEqual(expectedMetaResult);
      expect(getMetaInfoFn).toHaveBeenCalledWith(startedContainer, ports);
      expect(environment.up).toHaveBeenCalledWith();
      expect(dockerComposeBuilderFn).toHaveBeenCalledWith(dockerComposeConfig);
    });
  });

  describe("startAllContainers", () => {
    it("should call starter function", async () => {
      const config: JestTestcontainersConfig = {
        rabbit: { image: "rabbit" },
        redis: { image: "redis" }
      };
      const container = (null as unknown) as StartedTestContainer;
      const redisPortMappings = new Map<number, number>([[1, 2]]);
      const rabbitPortMappings = new Map<number, number>([[3, 4]]);
      const infos: AllStartedContainersAndMetaInfo = {
        rabbit: {
          name: "rabbit",
          container,
          ip: "localhost",
          portMappings: rabbitPortMappings
        },
        redis: {
          name: "redis",
          container,
          ip: "localhost",
          portMappings: redisPortMappings
        }
      };
      const startContainerFn: any = jest.fn(
        (cfg: SingleContainerConfig) => infos[cfg.image]
      );

      const allStartedContainerAndMetaInfo = await startAllContainers(
        config,
        startContainerFn
      );

      expect(allStartedContainerAndMetaInfo).toEqual(infos);
      expect(startContainerFn).toHaveBeenCalledWith(config.rabbit);
      expect(startContainerFn).toHaveBeenCalledWith(config.redis);
    });

    it("should call docker compose starter function", async () => {
      const config: JestTestcontainersConfig = {
        dockerCompose: {
          composeFilePath: ".",
          composeFile: "docker-compose.yml"
        }
      };
      const container = (null as unknown) as StartedTestContainer;
      const redisPortMappings = new Map<number, number>([[1, 2]]);
      const infos: AllStartedContainersAndMetaInfo = {
        redis: {
          name: "redis",
          container,
          ip: "localhost",
          portMappings: redisPortMappings
        }
      };
      const startContainerFn: any = jest.fn();
      const startDockerComposeContainersFn: any = jest.fn(() => infos);

      const allStartedContainerAndMetaInfo = await startAllContainers(
        config,
        startContainerFn,
        startDockerComposeContainersFn
      );

      expect(allStartedContainerAndMetaInfo).toEqual(infos);
      expect(startDockerComposeContainersFn).toHaveBeenCalledWith(
        config.dockerCompose
      );
    });
  });
});
