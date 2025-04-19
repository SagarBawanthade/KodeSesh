import Navbar from './Navbar';

const blogs = [
  {
    id: 1,
    title: "AWS CI/CD Pipeline: A Comprehensive Implementation Guide",
    description: "In this article we will see, how to build a complete CICD pipeline for a simple application using AWS.",
    imageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1724651840399/62a72e85-c61f-47e5-98f2-4d63a89cfacb.png?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp",
    path: "https://sagarbawanthade30.hashnode.dev/aws-cicd-pipeline-a-comprehensive-implementation-guide",
  },
  {
    id: 2,
    title: "Deploying Multiple Websites on Apache Using Different Ports",
    description: "In this blog post, I'll guide you through the process of deploying multiple websites on an Apache server running on an Ubuntu AWS EC2 instance using the port-based method. This method allows you to host several sites without the need for custom domain names, simply by accessing them via different ports.",
    imageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1725179520680/8e8b4fab-7b21-4262-8044-851626f3342b.png?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp",
    path: "https://sagarbawanthade30.hashnode.dev/deploying-multiple-websites-on-apache-using-different-ports",
  },
  {
    id: 3,
    title: "Kubernetes Series : Why Kuberentes? Architecture in-Depth",
    description: "In simple terms, Kubernetes, often abbreviated as K8s, is an open-source platform designed to automate deploying, scaling, and operating containerized applications. Developed by Google, Kubernetes has become the go-to solution for managing complex applications in the cloud. It ensures that your applications run consistently and reliably, no matter where they're deployed.",
    imageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1720779522697/735c56d8-3383-48c1-a50f-735f333ed368.png?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp",
    path: "https://sagarbawanthade30.hashnode.dev/kubernetes-series-why-kuberentes-architecture-in-depth",
  },
  {
    id: 4,
    title: "Kubernetes Series : Deploying a Simple Static Application on Kubernetes Using Google Kubernetes Engine (GKE)",
    description: "In this blog, you will learn how to deploy a static application on Kubernetes using Google Kubernetes (Google Cloud Provider)..",
    imageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1720779522697/735c56d8-3383-48c1-a50f-735f333ed368.png?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp",
    path: "https://sagarbawanthade30.hashnode.dev/kubernetes-series-deploying-a-simple-static-application-on-kubernetes-using-google-kubernetes-engine-gke",
  },
  {
    id: 5,
    title: "Kubernetes Series Journey: From Confusion to Confidence",
    description: "Hey there, tech enthusiasts! Today, I want to share my recent adventure into the world of Kubernetes. It's been a wild ride, and I hope my story can help others who are just starting out",
    imageUrl: "https://cdn.hashnode.com/res/hashnode/image/upload/v1723272971042/87a43994-44e7-4fa1-a4e3-4b1ad6c352d1.png?w=1600&h=840&fit=crop&crop=entropy&auto=compress,format&format=webp",
    path: "https://sagarbawanthade30.hashnode.dev/kubernetes-series-journey-from-confusion-to-confidence",
  },
];

const BlogList = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      <header className="w-full">
        <Navbar />
      </header>

      <main className="px-6 md:px-20 pt-12 pb-16">
        {blogs.map((blog, index) => (
          <a
            key={blog.id}
            href={blog.path}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col md:flex-row items-center md:items-start border-b border-cyan-400 pb-8 cursor-pointer hover:bg-gray-900 transition duration-300 rounded-lg ${
              index === 0 ? 'mt-10' : 'mt-6'
            } ${index === blogs.length - 1 ? 'mb-16' : ''}`}
          >
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full md:w-[380px] h-[240px] object-cover rounded-md shadow-lg mb-6 md:mb-0 md:mr-10"
            />
            <div className="text-white max-w-3xl">
              <h2 className="text-2xl font-bold mb-4">{blog.title}</h2>
              <p className="text-gray-300 text-lg">{blog.description}</p>
            </div>
          </a>
        ))}
      </main>
    </div>
  );
};

export default BlogList;

